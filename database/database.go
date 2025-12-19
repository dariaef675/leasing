package database

import (
	"fmt"
	"log"

	"awesomeProject/config"
	"awesomeProject/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		cfg.Database.Host,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.DBName,
		cfg.Database.Port,
		cfg.Database.SSLMode,
	)

	log.Printf("Attempting to connect with password length: %d", len(cfg.Database.Password))

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Printf("Не удалось установить соединение с DSN: host=%s, port=%s, user=%s, dbname=%s",
			cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.DBName)
		return fmt.Errorf("ОШИБКА подключения к БД: %w", err)
	}

	log.Println("Соединение с БД установлено")

	if err := AutoMigrate(); err != nil {
		return fmt.Errorf("ОШИБКА миграции БД: %w", err)
	}

	return nil
}

func AutoMigrate() error {
	return DB.AutoMigrate(
		&models.User{},
		&models.Client{},
		&models.Equipment{},
		&models.Contract{},
	)
}
