package handlers

import (
	"awesomeProject/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreateEquipmentRequest struct {
	Type        string  `json:"type" binding:"required"`
	Model       string  `json:"model" binding:"required"`
	Serial      string  `json:"serial"`
	Year        int     `json:"year"`
	Cost        float64 `json:"cost" binding:"required"`
	Status      string  `json:"status"`
	Photo       string  `json:"photo"`
	Description string  `json:"description"`
}
type UpdateEquipmentRequest struct {
	Type        string  `json:"type"`
	Model       string  `json:"model"`
	Serial      string  `json:"serial"`
	Year        int     `json:"year"`
	Cost        float64 `json:"cost"`
	Status      string  `json:"status"`
	Photo       string  `json:"photo"`
	Description string  `json:"description"`
}

type EquipmentHandler struct {
	DB *gorm.DB
}

func validateStatus(status string) bool {
	validStatuses := []string{"available", "in_lease", "returned"}
	if status == "" {
		return true // Пустой статус допустим, будет использован дефолтный
	}
	for _, validStatus := range validStatuses {
		if strings.ToLower(status) == validStatus {
			return true
		}
	}
	return false
}

func checkRole(c *gin.Context) bool {
	userRole, exists := c.Get("user_role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == string(models.RoleAdmin) || role == string(models.RoleManager)
}

func (h *EquipmentHandler) CreateEquipment(c *gin.Context) {
	if !checkRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав для создания оборудования"})
		return
	}

	var req CreateEquipmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Status != "" && !validateStatus(req.Status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недействительный статус. Доступные значения: available, in_lease, returned"})
		return
	}

	status := req.Status
	if status == "" {
		status = "available"
	}

	equipment := models.Equipment{
		Type:        req.Type,
		Model:       req.Model,
		Serial:      req.Serial,
		Year:        req.Year,
		Cost:        req.Cost,
		Status:      status,
		Photo:       req.Photo,
		Description: req.Description,
	}

	if err := h.DB.Create(&equipment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать оборудование"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Оборудование успешно создано",
		"equipment": equipment,
	})
}

func (h *EquipmentHandler) GetEquipmentList(c *gin.Context) {
	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	var list []models.Equipment
	query := h.DB.Preload("Client").Where("deleted_at IS NULL")

	if role == string(models.RoleClient) {
		query = query.Where("status = ?", "available")
	}

	if err := query.Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось отобразить оборудование"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"equipment": list,
		"count":     len(list),
	})
}

func (h *EquipmentHandler) GetEquipmentByID(c *gin.Context) {
	id := c.Param("id")
	var item models.Equipment

	if err := h.DB.Preload("Client").Where("id = ? AND deleted_at IS NULL", id).First(&item).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Оборудование не найдено"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось отобразить оборудование"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"equipment": item})
}

func (h *EquipmentHandler) UpdateEquipment(c *gin.Context) {
	if !checkRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав для обновления оборудования"})
		return
	}

	id := c.Param("id")
	var req UpdateEquipmentRequest
	var item models.Equipment

	if err := h.DB.Where("id = ? AND deleted_at IS NULL", id).First(&item).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Оборудование не найдено"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось отобразить оборудование"})
		}
		return
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Status != "" && !validateStatus(req.Status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недействительный статус. Доступные значения: available, in_lease, returned"})
		return
	}

	updates := make(map[string]interface{})
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Model != "" {
		updates["model"] = req.Model
	}
	if req.Serial != "" {
		updates["serial"] = req.Serial
	}
	if req.Year != 0 {
		updates["year"] = req.Year
	}
	if req.Cost != 0 {
		updates["cost"] = req.Cost
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.Photo != "" {
		updates["photo"] = req.Photo
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}

	if err := h.DB.Model(&item).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить оборудование"})
		return
	}

	h.DB.Where("id = ?", id).First(&item)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Оборудование успешно обновлено",
		"equipment": item,
	})
}

func (h *EquipmentHandler) DeleteEquipment(c *gin.Context) {
	if !checkRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав для обновления оборудования"})
		return
	}

	id := c.Param("id")
	var item models.Equipment

	if err := h.DB.Where("id = ? AND deleted_at IS NULL", id).First(&item).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Оборудование не найдено"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось отобразить оборудование"})
		}
		return
	}
	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить оборудование"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Оборудование успешно удалено"})
}
