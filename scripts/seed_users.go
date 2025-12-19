package main

import (
	"fmt"
	"log"

	"awesomeProject/config"
	"awesomeProject/database"
	"awesomeProject/models"
	"awesomeProject/utils"

	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()
	if err := database.Connect(cfg); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	utils.InitJWT(cfg.JWT.SecretKey)

	predefinedUsers := []struct {
		Email     string
		Password  string
		Role      models.Role
		Approved  bool
		FirstName string
		LastName  string
	}{

		{
			Email:     "admin@leasing.local",
			Password:  "Admin123!",
			Role:      models.RoleAdmin,
			Approved:  true,
			FirstName: "Администратор",
			LastName:  "Системы",
		},
		{
			Email:     "admin2@leasing.local",
			Password:  "Admin456!",
			Role:      models.RoleAdmin,
			Approved:  true,
			FirstName: "Администратор",
			LastName:  "Главный",
		},

		{
			Email:     "manager@leasing.local",
			Password:  "Manager123!",
			Role:      models.RoleManager,
			Approved:  true,
			FirstName: "Иван",
			LastName:  "Менеджеров",
		},
		{
			Email:     "manager2@leasing.local",
			Password:  "Manager456!",
			Role:      models.RoleManager,
			Approved:  true,
			FirstName: "Мария",
			LastName:  "Управляющая",
		},
		{
			Email:     "manager3@leasing.local",
			Password:  "Manager789!",
			Role:      models.RoleManager,
			Approved:  true,
			FirstName: "Петр",
			LastName:  "Координатор",
		},
	}

	fmt.Println("Создание предварительных пользователей...")
	fmt.Println("=" + string(make([]byte, 60)) + "=")

	for _, userData := range predefinedUsers {
		var existingUser models.User
		err := database.DB.Where("email = ?", userData.Email).First(&existingUser).Error

		if err == gorm.ErrRecordNotFound {
			hashedPassword, err := utils.HashPassword(userData.Password)
			if err != nil {
				log.Printf("Ошибка хеширования пароля для %s: %v", userData.Email, err)
				continue
			}

			user := models.User{
				Email:     userData.Email,
				Password:  hashedPassword,
				Role:      userData.Role,
				Approved:  userData.Approved,
				FirstName: userData.FirstName,
				LastName:  userData.LastName,
			}

			if err := database.DB.Create(&user).Error; err != nil {
				log.Printf("Ошибка создания пользователя %s: %v", userData.Email, err)
				continue
			}

			fmt.Printf("✓ Создан: %s (%s)\n", userData.Email, userData.Role)
			fmt.Printf("  Email: %s\n", userData.Email)
			fmt.Printf("  Пароль: %s\n", userData.Password)
			fmt.Println()
		} else if err == nil {
			hashedPassword, err := utils.HashPassword(userData.Password)
			if err != nil {
				log.Printf("Ошибка хеширования пароля для %s: %v", userData.Email, err)
				continue
			}

			existingUser.Password = hashedPassword
			existingUser.Approved = userData.Approved
			existingUser.Role = userData.Role
			if userData.FirstName != "" {
				existingUser.FirstName = userData.FirstName
			}
			if userData.LastName != "" {
				existingUser.LastName = userData.LastName
			}

			if err := database.DB.Save(&existingUser).Error; err != nil {
				log.Printf("Ошибка обновления пользователя %s: %v", userData.Email, err)
				continue
			}

			fmt.Printf("↻ Обновлен: %s (%s)\n", userData.Email, userData.Role)
			fmt.Printf("  Email: %s\n", userData.Email)
			fmt.Printf("  Пароль: %s\n", userData.Password)
			fmt.Println()
		} else {
			log.Printf("Ошибка проверки пользователя %s: %v", userData.Email, err)
		}
	}

	fmt.Println("=" + string(make([]byte, 60)) + "=")
	fmt.Println("\nГотово! Предварительные пользователи созданы/обновлены.")
	fmt.Println("\nДоступные учетные записи:")
	fmt.Println("\nАдминистраторы:")
	fmt.Println("  admin@leasing.local / Admin123!")
	fmt.Println("  admin2@leasing.local / Admin456!")
	fmt.Println("\nМенеджеры:")
	fmt.Println("  manager@leasing.local / Manager123!")
	fmt.Println("  manager2@leasing.local / Manager456!")
	fmt.Println("  manager3@leasing.local / Manager789!")
}
