package handlers

import (
	"net/http"
	"strconv"

	"awesomeProject/database"
	"awesomeProject/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreateClientRequest struct {
	FirstName   string `json:"first_name" binding:"required"`
	LastName    string `json:"last_name" binding:"required"`
	MiddleName  string `json:"middle_name"`
	Email       string `json:"email" binding:"required,email"`
	Phone       string `json:"phone" binding:"required"`
	CompanyName string `json:"company_name"`
	INN         string `json:"inn"`
	Address     string `json:"address"`
}

type UpdateClientRequest struct {
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	MiddleName  string `json:"middle_name"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	CompanyName string `json:"company_name"`
	INN         string `json:"inn"`
	Address     string `json:"address"`
}

func CreateClient(c *gin.Context) {
	var req CreateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	role := userRole.(string)
	if role != string(models.RoleAdmin) && role != string(models.RoleManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to create clients"})
		return
	}

	var existingClient models.Client
	if err := database.DB.Where("email = ?", req.Email).First(&existingClient).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Client with this email already exists"})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	client := models.Client{
		FirstName:   req.FirstName,
		LastName:    req.LastName,
		MiddleName:  req.MiddleName,
		Email:       req.Email,
		Phone:       req.Phone,
		CompanyName: req.CompanyName,
		INN:         req.INN,
		Address:     req.Address,
		CreatedBy:   userID.(uint),
	}

	if err := database.DB.Create(&client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create client"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Client created successfully",
		"client":  client,
	})
}

func GetClients(c *gin.Context) {
	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	var clients []models.Client
	var query *gorm.DB

	if role == string(models.RoleClient) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Clients can only view their own data"})
		return
	}

	query = database.DB
	query = query.Where("deleted_at IS NULL")

	if err := query.Find(&clients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch clients"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"clients": clients,
		"count":   len(clients),
	})
}
func GetClient(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client ID"})
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	var client models.Client
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&client).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	if role == string(models.RoleClient) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"client": client})
}
func UpdateClient(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client ID"})
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	if role != string(models.RoleAdmin) && role != string(models.RoleManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to update clients"})
		return
	}

	var client models.Client
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&client).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	var req UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.FirstName != "" {
		client.FirstName = req.FirstName
	}
	if req.LastName != "" {
		client.LastName = req.LastName
	}
	if req.MiddleName != "" {
		client.MiddleName = req.MiddleName
	}
	if req.Email != "" {
		if req.Email != client.Email {
			var existingClient models.Client
			if err := database.DB.Where("email = ? AND id != ?", req.Email, id).First(&existingClient).Error; err == nil {
				c.JSON(http.StatusConflict, gin.H{"error": "Client with this email already exists"})
				return
			}
		}
		client.Email = req.Email
	}
	if req.Phone != "" {
		client.Phone = req.Phone
	}
	if req.CompanyName != "" {
		client.CompanyName = req.CompanyName
	}
	if req.INN != "" {
		client.INN = req.INN
	}
	if req.Address != "" {
		client.Address = req.Address
	}

	if err := database.DB.Save(&client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update client"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Client updated successfully",
		"client":  client,
	})
}

func DeleteClient(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client ID"})
		return
	}

	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	if role != string(models.RoleAdmin) && role != string(models.RoleManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to delete clients"})
		return
	}

	var client models.Client
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&client).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	if err := database.DB.Delete(&client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete client"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Client deleted successfully"})
}
