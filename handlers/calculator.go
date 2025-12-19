package handlers

import (
	"net/http"

	"awesomeProject/utils"

	"github.com/gin-gonic/gin"
)

type CalculateLeaseRequest struct {
	AssetValue   float64 `json:"asset_value" binding:"required,min=0"`
	ContractTerm int     `json:"contract_term" binding:"required,min=1"`
	Category     string  `json:"category" binding:"required"`
	PaymentType  string  `json:"payment_type" binding:"required,oneof=even decreasing"`
}

type CalculateLeaseResponse struct {
	MonthlyPayment float64 `json:"monthly_payment"`
}

var categoryInterestRates = map[string]float64{
	"легковой":       0.12,
	"коммерческий":   0.13,
	"грузовой":       0.14,
	"спецтехника":    0.15,
	"сельхозтехника": 0.16,
	"оборудование":   0.17,
}

func CalculateLease(c *gin.Context) {
	var req CalculateLeaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные: " + err.Error()})
		return
	}

	interestRate, exists := categoryInterestRates[req.Category]
	if !exists {
		interestRate = 0.12
	}

	monthlyPayment := utils.CalculateLeasePayment(req.AssetValue, req.ContractTerm, interestRate, req.PaymentType)

	c.JSON(http.StatusOK, CalculateLeaseResponse{
		MonthlyPayment: monthlyPayment,
	})
}
