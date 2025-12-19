package handlers

import (
	"net/http"

	"awesomeProject/database"
	"awesomeProject/models"
	"awesomeProject/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Некорректные данные. Проверьте правильность заполнения всех полей.",
		})
		return
	}

	var existingUser models.User
	if err := database.DB.Where("email = ? AND deleted_at IS NULL", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Пользователь с таким email уже зарегистрирован"})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при обращении к базе данных. Попробуйте позже или обратитесь к администратору.",
		})
		return
	}
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при обработке пароля. Попробуйте позже или обратитесь к администратору.",
		})
		return
	}

	role := models.RoleClient
	approved := true

	if req.Role != "" && req.Role != "Client" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "При регистрации можно создать только роль Клиент. Менеджеры и администраторы используют предварительно созданные учетные записи.",
		})
		return
	}

	user := models.User{
		Email:    req.Email,
		Password: hashedPassword,
		Role:     role,
		Approved: approved,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при создании пользователя. Попробуйте позже или обратитесь к администратору.",
		})
		return
	}

	responseMessage := "Пользователь успешно зарегистрирован"
	if !approved {
		responseMessage = "Регистрация успешна. Ваш аккаунт ожидает одобрения для роли " + string(role) + "."
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": responseMessage,
		"user": gin.H{
			"id":       user.ID,
			"email":    user.Email,
			"role":     user.Role,
			"approved": user.Approved,
		},
	})
}
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Некорректные данные. Проверьте правильность заполнения всех полей.",
		})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ? AND deleted_at IS NULL", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный email или пароль"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при обращении к базе данных. Попробуйте позже или обратитесь к администратору.",
		})
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный email или пароль"})
		return
	}

	if (user.Role == models.RoleManager || user.Role == models.RoleAdmin) && !user.Approved {
		c.JSON(http.StatusForbidden, gin.H{
			"error":    "Ваш аккаунт ожидает одобрения администратором. Пожалуйста, дождитесь подтверждения.",
			"approved": false,
		})
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Email, string(user.Role), 24)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при создании токена доступа. Попробуйте позже или обратитесь к администратору.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Вход выполнен успешно",
		"token":   token,
		"user": gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"role":       user.Role,
			"approved":   user.Approved,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"phone":      user.Phone,
			"created_at": user.CreatedAt,
		},
	})
}
