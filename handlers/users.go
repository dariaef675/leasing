package handlers

import (
	"net/http"
	"strconv"

	"awesomeProject/database"
	"awesomeProject/models"
	"awesomeProject/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreateUserRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	Role      string `json:"role" binding:"required"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
	Approved  bool   `json:"approved"`
}

type UpdateUserRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	Role      string `json:"role"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
	Approved  *bool  `json:"approved"`
}

// админ
func GetUsers(c *gin.Context) {
	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав просмотра пользователей"})
		return
	}

	var users []models.User
	if err := database.DB.Where("deleted_at IS NULL").Order("created_at DESC").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка отображения пользователей"})
		return
	}

	for i := range users {
		users[i].Password = ""
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"count": len(users),
	})
}

func CreateUser(c *gin.Context) {
	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав создания пользователей"})
		return
	}

	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email уже используется"})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
		return
	}

	userRoleModel := models.Role(req.Role)
	if userRoleModel != models.RoleAdmin && userRoleModel != models.RoleManager && userRoleModel != models.RoleClient {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недействительная роль"})
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось хешировать пароль"})
		return
	}

	user := models.User{
		Email:     req.Email,
		Password:  hashedPassword,
		Role:      userRoleModel,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
		Approved:  req.Approved,
	}

	if (userRoleModel == models.RoleAdmin || userRoleModel == models.RoleManager) && !req.Approved {
		user.Approved = false
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать пользователя"})
		return
	}

	user.Password = ""

	c.JSON(http.StatusCreated, gin.H{
		"message": "Пользователь успешно создан",
		"user":    user,
	})
}

func GetUser(c *gin.Context) {
	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав просмотра пользователей"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недейсвтительный ID пользователя"})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
		}
		return
	}
	user.Password = ""

	c.JSON(http.StatusOK, gin.H{"user": user})
}

func UpdateUser(c *gin.Context) {
	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	// Только админ может обновлять пользователей
	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недейсвтительный ID пользователя"})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
		}
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Email != "" && req.Email != user.Email {
		var existingUser models.User
		if err := database.DB.Where("email = ? AND id != ?", req.Email, id).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
			return
		}
		user.Email = req.Email
	}

	if req.Password != "" {
		hashedPassword, err := utils.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.Password = hashedPassword
	}

	if req.Role != "" {
		userRoleModel := models.Role(req.Role)
		if userRoleModel != models.RoleAdmin && userRoleModel != models.RoleManager && userRoleModel != models.RoleClient {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
			return
		}
		user.Role = userRoleModel
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

	if req.Approved != nil {
		user.Approved = *req.Approved
	}

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	user.Password = ""

	c.JSON(http.StatusOK, gin.H{
		"message": "Пользователь успешно обновлен",
		"user":    user,
	})
}

func DeleteUser(c *gin.Context) {
	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недействительный ID пользователя"})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ОШИБКА БД"})
		}
		return
	}

	currentUserID, _ := c.Get("user_id")
	if user.ID == currentUserID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Нельзя удалить свой аккаунт"})
		return
	}

	if err := database.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка удаления пользователя"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Пользователь успешно удален"})
}
