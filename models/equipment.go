package models

import (
	"time"

	"gorm.io/gorm"
)

type Equipment struct {
	ID uint `gorm:"primaryKey" json:"id"`

	Type        string  `json:"type" gorm:"not null"`
	Model       string  `json:"model" gorm:"not null"`
	Serial      string  `json:"serial"`
	Year        int     `json:"year"`
	Cost        float64 `json:"cost" gorm:"not null"`
	Status      string  `json:"status" gorm:"default:'available'"`
	Photo       string  `json:"photo"`
	Description string  `json:"description" gorm:"type:text"`

	ClientID *uint   `json:"client_id" gorm:"index"`
	Client   *Client `json:"client,omitempty" gorm:"foreignKey:ClientID"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

func (Equipment) TableName() string {
	return "equipments"
}
