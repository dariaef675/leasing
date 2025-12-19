package handlers

import (
	"log"
	"net/http"

	"awesomeProject/database"
	"awesomeProject/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UpdateProfileRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
}

func GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован в системе"})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

func UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
		}
		return
	}

	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить профиль"})
		return
	}

	if user.FirstName != "" && user.LastName != "" && user.Phone != "" {
		var client models.Client
		err := database.DB.Where("user_id = ?", user.ID).First(&client).Error

		if err == gorm.ErrRecordNotFound {
			client = models.Client{
				UserID:    &user.ID,
				FirstName: user.FirstName,
				LastName:  user.LastName,
				Email:     user.Email,
				Phone:     user.Phone,
				CreatedBy: user.ID,
			}
			if err := database.DB.Create(&client).Error; err != nil {

				log.Printf("Не удлось создать запись о клиенте: %v", err)
			}
		} else if err == nil {
			client.FirstName = user.FirstName
			client.LastName = user.LastName
			client.Phone = user.Phone
			client.Email = user.Email
			if err := database.DB.Save(&client).Error; err != nil {
				log.Printf("Не удалось обновить запись о клиенте: %v", err)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Профиль успешно обновлен",
		"user":    user,
	})
}
