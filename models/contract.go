package models

import (
	"time"

	"gorm.io/gorm"
)

type ContractStatus string

const (
	ContractStatusPending      ContractStatus = "pending"
	ContractStatusInProcessing ContractStatus = "in_processing"
	ContractStatusActive       ContractStatus = "active"
	ContractStatusCompleted    ContractStatus = "completed"
)

type Contract struct {
	ID uint `gorm:"primaryKey" json:"id"`

	ClientID uint   `json:"client_id" gorm:"not null;index"`
	Client   Client `json:"client,omitempty" gorm:"foreignKey:ClientID"`

	EquipmentID uint      `json:"equipment_id" gorm:"not null;index"`
	Equipment   Equipment `json:"equipment,omitempty" gorm:"foreignKey:EquipmentID"`

	StartDate      time.Time      `json:"start_date" gorm:"not null"`
	EndDate        time.Time      `json:"end_date" gorm:"not null"`
	MonthlyPayment float64        `json:"monthly_payment" gorm:"not null"`
	TotalAmount    float64        `json:"total_amount" gorm:"not null"`
	Status         ContractStatus `json:"status" gorm:"default:'pending'"`

	ProcessedBy *uint      `json:"processed_by" gorm:"index"`
	ProcessedAt *time.Time `json:"processed_at"`

	ClientNotes  string `json:"client_notes" gorm:"type:text"`
	ManagerNotes string `json:"manager_notes" gorm:"type:text"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

func (Contract) TableName() string {
	return "contracts"
}
