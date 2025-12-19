package utils

import (
	"math"
	"time"
)

func CalculateLeaseCost(equipmentCost float64, months int, interestRate float64) (monthlyPayment float64, totalAmount float64) {
	if months <= 0 {
		return 0, 0
	}

	// Простая формула аннуитетного платежа
	// A = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
	// где P - основная сумма, r - месячная процентная ставка, n - количество месяцев

	monthlyRate := math.Pow(1+interestRate, 1.0/12) - 1

	if monthlyRate == 0 {
		monthlyPayment = equipmentCost / float64(months)
		totalAmount = equipmentCost
	} else {
		pow := math.Pow(1+monthlyRate, float64(months))
		monthlyPayment = equipmentCost * (monthlyRate * pow) / (pow - 1)
		totalAmount = monthlyPayment * float64(months)
	}

	monthlyPayment = math.Round(monthlyPayment*100) / 100
	totalAmount = math.Round(totalAmount*100) / 100

	return monthlyPayment, totalAmount
}

// CalculateLeasePayment рассчитывает ежемесячный платеж для калькулятора
// paymentType: "even" - равномерный (аннуитетный), "decreasing" - убывающий
func CalculateLeasePayment(assetValue float64, contractTerm int, interestRate float64, paymentType string) float64 {
	if assetValue <= 0 || contractTerm <= 0 {
		return 0
	}

	monthlyRate := interestRate / 12
	var monthlyPayment float64

	if paymentType == "even" {
		// Аннуитетный (равномерный) платеж
		if monthlyRate > 0 {
			monthlyPayment = assetValue * (monthlyRate * math.Pow(1+monthlyRate, float64(contractTerm))) / (math.Pow(1+monthlyRate, float64(contractTerm)) - 1)
		} else {
			monthlyPayment = assetValue / float64(contractTerm)
		}
	} else {
		// Убывающий платеж
		principalPayment := assetValue / float64(contractTerm)
		monthlyPayment = principalPayment + (assetValue * monthlyRate)
	}

	return math.Round(monthlyPayment*100) / 100
}

func CalculateLeaseMonths(startDate, endDate time.Time) int {
	if endDate.Before(startDate) || endDate.Equal(startDate) {
		return 1 // Минимум 1 месяц
	}

	years := endDate.Year() - startDate.Year()
	months := endDate.Month() - startDate.Month()

	totalMonths := years*12 + int(months)

	if endDate.Day() < startDate.Day() {
		totalMonths--
	}

	if totalMonths < 1 {
		totalMonths = 1
	}

	return totalMonths
}
