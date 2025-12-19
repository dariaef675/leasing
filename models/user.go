package models

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleAdmin   Role = "Administrator"
	RoleManager Role = "Manager"
	RoleClient  Role = "Client"
)

type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null"`
	Password  string         `json:"-" gorm:"not null"`
	FirstName string         `json:"first_name" gorm:"type:varchar(100)"`
	LastName  string         `json:"last_name" gorm:"type:varchar(100)"`
	Phone     string         `json:"phone" gorm:"type:varchar(20)"`
	Role      Role           `json:"role" gorm:"type:varchar(20);not null;default:'Client'"`
	Approved  bool           `json:"approved" gorm:"default:false"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

func (User) TableName() string {
	return "users"
}
