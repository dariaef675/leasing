package handlers

import (
	"net/http"
	"strconv"
	"time"

	"awesomeProject/database"
	"awesomeProject/models"
	"awesomeProject/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreateContractRequest struct {
	ClientID       *uint     `json:"client_id"`
	EquipmentID    uint      `json:"equipment_id" binding:"required"`
	StartDate      time.Time `json:"start_date" binding:"required"`
	EndDate        time.Time `json:"end_date" binding:"required"`
	ClientNotes    string    `json:"client_notes"`
	ManagerNotes   string    `json:"manager_notes"`
	Status         string    `json:"status"`
	MonthlyPayment *float64  `json:"monthly_payment"`
	TotalAmount    *float64  `json:"total_amount"`
}

type UpdateContractRequest struct {
	Status         string   `json:"status"`
	ManagerNotes   string   `json:"manager_notes"`
	MonthlyPayment *float64 `json:"monthly_payment"`
}

func CreateContract(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Клиент не авторизован"})
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	if role != string(models.RoleClient) && role != string(models.RoleManager) && role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req CreateContractRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var equipment models.Equipment
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", req.EquipmentID).First(&equipment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Оборудование не найдено"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
		}
		return
	}

	if equipment.Status != "available" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Оборудование недоступно для лизинга"})
		return
	}

	if req.EndDate.Before(req.StartDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Конечная дата не должна быть позже дня начала лизинга"})
		return
	}

	var client models.Client
	if role == string(models.RoleClient) {

		var user models.User
		if err := database.DB.Where("id = ? AND deleted_at IS NULL", userID).First(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка загрузки личного кабинета"})
			return
		}
		if user.Phone == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Для подачи заявки необходимо указать номер телефона в профиле."})
			return
		}

		err := database.DB.Where("user_id = ? AND deleted_at IS NULL", userID).First(&client).Error
		if err == gorm.ErrRecordNotFound {
			if user.Email != "" {
				var existingClient models.Client
				findErr := database.DB.Where("email = ? AND deleted_at IS NULL", user.Email).First(&existingClient).Error
				if findErr == nil {
					if existingClient.UserID == nil {
						existingClient.UserID = new(uint)
						*existingClient.UserID = user.ID
						database.DB.Save(&existingClient)
					}
					client = existingClient
				} else if findErr != gorm.ErrRecordNotFound {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
					return
				} else {
					var archivedClient models.Client
					archErr := database.DB.Unscoped().Where("email = ?", user.Email).First(&archivedClient).Error
					if archErr == nil {
						archivedClient.DeletedAt = gorm.DeletedAt{}
						archivedClient.UserID = new(uint)
						*archivedClient.UserID = user.ID
						archivedClient.Phone = user.Phone
						if archivedClient.FirstName == "" {
							archivedClient.FirstName = user.FirstName
						}
						if archivedClient.LastName == "" {
							archivedClient.LastName = user.LastName
						}
						if err := database.DB.Save(&archivedClient).Error; err != nil {
							c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось восстановить архивного клиента"})
							return
						}
						client = archivedClient
					} else if archErr != gorm.ErrRecordNotFound {
						c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
						return
					} else {
						firstName := user.FirstName
						lastName := user.LastName
						if firstName == "" && lastName == "" {
							prefix := user.Email
							if idx := len(prefix); idx > 50 {
								prefix = prefix[:50]
							}
							firstName = prefix
							lastName = "Клиент"
						}

						client = models.Client{
							UserID:    &user.ID,
							FirstName: firstName,
							LastName:  lastName,
							Email:     user.Email,
							Phone:     user.Phone,
							CreatedBy: user.ID,
						}

						if err := database.DB.Create(&client).Error; err != nil {
							c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать профиль клиента"})
							return
						}
					}
				}
			} else {
				firstName := user.FirstName
				lastName := user.LastName
				if firstName == "" && lastName == "" {
					firstName = "Клиент"
					lastName = "Системы"
				}

				client = models.Client{
					UserID:    &user.ID,
					FirstName: firstName,
					LastName:  lastName,
					Phone:     user.Phone,
					CreatedBy: user.ID,
				}

				if err := database.DB.Create(&client).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать профиль клиента"})
					return
				}
			}
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
			return
		} else {
			if client.Phone == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Для подачи заявки необходимо указать номер телефона в профиле клиента."})
				return
			}
		}
	} else {
		if req.ClientID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "client_id требуется для передачи менеджеру"})
			return
		}
		if err := database.DB.Where("id = ? AND deleted_at IS NULL", *req.ClientID).First(&client).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Клиент не найден"})
			return
		}
	}

	var monthlyPayment, totalAmount float64
	if req.MonthlyPayment != nil && req.TotalAmount != nil {
		monthlyPayment = *req.MonthlyPayment
		totalAmount = *req.TotalAmount
	} else {
		months := utils.CalculateLeaseMonths(req.StartDate, req.EndDate)
		interestRate := 0.15
		monthlyPayment, totalAmount = utils.CalculateLeaseCost(equipment.Cost, months, interestRate)
	}
	contractStatus := models.ContractStatusPending
	if role != string(models.RoleClient) && req.Status != "" {
		contractStatus = models.ContractStatus(req.Status)
	}
	contract := models.Contract{
		ClientID:       client.ID,
		EquipmentID:    req.EquipmentID,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		MonthlyPayment: monthlyPayment,
		TotalAmount:    totalAmount,
		Status:         contractStatus,
		ClientNotes:    req.ClientNotes,
		ManagerNotes:   req.ManagerNotes,
	}

	if role != string(models.RoleClient) {
		processedBy := userID.(uint)
		contract.ProcessedBy = &processedBy
		now := time.Now()
		contract.ProcessedAt = &now
	}

	if err := database.DB.Create(&contract).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать договор"})
		return
	}

	equipment.Status = "in_lease"
	equipment.ClientID = &client.ID
	if err := database.DB.Save(&equipment).Error; err != nil {
	}

	database.DB.Preload("Client").Preload("Equipment").First(&contract, contract.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Лизинговый договор успешно оформлен",
		"contract": contract,
	})
}

func GetContracts(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	var contracts []models.Contract

	archived := c.Query("archived") == "true"

	var query *gorm.DB
	if archived {
		if role != string(models.RoleAdmin) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав"})
			return
		}
		query = database.DB.Unscoped().Preload("Client").Preload("Equipment").Where("deleted_at IS NOT NULL")
	} else {
		query = database.DB.Preload("Client").Preload("Equipment").Where("deleted_at IS NULL")
	}

	if role == string(models.RoleClient) {
		var client models.Client
		if err := database.DB.Where("user_id = ? AND deleted_at IS NULL", userID).First(&client).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Клиент не найден"})
			return
		}
		query = query.Where("client_id = ?", client.ID)
	}
	if err := query.Order("created_at DESC").Find(&contracts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось отобразить договоры"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"contracts": contracts,
		"count":     len(contracts),
	})
}

func GetContract(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недействительный ID договора"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	var contract models.Contract
	if err := database.DB.Preload("Client").Preload("Equipment").Where("id = ? AND deleted_at IS NULL", id).First(&contract).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Договор не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
		}
		return
	}

	if role == string(models.RoleClient) {
		var client models.Client
		if err := database.DB.Where("user_id = ? AND deleted_at IS NULL", userID).First(&client).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Нет доступа"})
			return
		}
		if contract.ClientID != client.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступно"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"contract": contract})
}

func UpdateContract(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недействительный ID договора"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	if role != string(models.RoleAdmin) && role != string(models.RoleManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет доступа к обновлению"})
		return
	}

	var contract models.Contract
	if err := database.DB.Preload("Equipment").Where("id = ? AND deleted_at IS NULL", id).First(&contract).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Договор не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
		}
		return
	}

	var req UpdateContractRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Status != "" {
		contract.Status = models.ContractStatus(req.Status)

		if req.Status == "in_processing" {
			contract.Status = models.ContractStatusInProcessing
			contract.ProcessedBy = new(uint)
			*contract.ProcessedBy = userID.(uint)
			now := time.Now()
			contract.ProcessedAt = &now
		}

		if req.Status == "approved" {
			contract.Status = models.ContractStatusActive
			contract.ProcessedBy = new(uint)
			*contract.ProcessedBy = userID.(uint)
			now := time.Now()
			contract.ProcessedAt = &now

			var equipment models.Equipment
			if err := database.DB.First(&equipment, contract.EquipmentID).Error; err == nil {
				equipment.Status = "in_lease"
				equipment.ClientID = &contract.ClientID
				database.DB.Save(&equipment)
			}
		}

		if req.Status == "completed" || req.Status == "rejected" {
			var equipment models.Equipment
			if err := database.DB.First(&equipment, contract.EquipmentID).Error; err == nil {
				equipment.Status = "available"
				equipment.ClientID = nil
				database.DB.Save(&equipment)
			}
		}
	}

	if req.ManagerNotes != "" {
		contract.ManagerNotes = req.ManagerNotes
	}

	if req.MonthlyPayment != nil {
		contract.MonthlyPayment = *req.MonthlyPayment
		months := utils.CalculateLeaseMonths(contract.StartDate, contract.EndDate)
		contract.TotalAmount = contract.MonthlyPayment * float64(months)
	}

	if err := database.DB.Save(&contract).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось озагрузить договор"})
		return
	}

	database.DB.Preload("Client").Preload("Equipment").First(&contract, contract.ID)

	c.JSON(http.StatusOK, gin.H{
		"message":  "Договор успешно обновлен",
		"contract": contract,
	})
}

func DeleteContract(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недействительный ID договора"})
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	if role != string(models.RoleAdmin) && role != string(models.RoleManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав удаления договора"})
		return
	}

	var contract models.Contract
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&contract).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Договор не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
		}
		return
	}

	if contract.Status == models.ContractStatusActive {
		var equipment models.Equipment
		if err := database.DB.First(&equipment, contract.EquipmentID).Error; err == nil {
			equipment.Status = "available"
			equipment.ClientID = nil
			database.DB.Save(&equipment)
		}
	}

	if err := database.DB.Delete(&contract).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить договор"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Договор успешно удален"})
}
