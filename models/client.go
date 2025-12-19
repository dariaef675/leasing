package models

import (
	"time"

	"gorm.io/gorm"
)

type Client struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      *uint          `json:"user_id" gorm:"index"`
	FirstName   string         `json:"first_name" gorm:"not null"`
	LastName    string         `json:"last_name" gorm:"not null"`
	MiddleName  string         `json:"middle_name"`
	Email       string         `json:"email" gorm:"uniqueIndex"`
	Phone       string         `json:"phone" gorm:"not null"`
	CompanyName string         `json:"company_name"`
	INN         string         `json:"inn"`
	Address     string         `json:"address"`
	CreatedBy   uint           `json:"created_by" gorm:"not null"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (Client) TableName() string {
	return "clients"
}
