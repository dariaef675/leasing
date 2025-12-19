package handlers

import (
	"net/http"
	"time"

	"awesomeProject/database"
	"awesomeProject/models"

	"github.com/gin-gonic/gin"
)

func GetStats(c *gin.Context) {
	userRole, _ := c.Get("user_role")
	role := userRole.(string)

	if role != string(models.RoleAdmin) && role != string(models.RoleManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Нет прав доступа"})
		return
	}

	var totalClients int64
	var activeClients int64
	database.DB.Model(&models.Client{}).Where("deleted_at IS NULL").Count(&totalClients)
	database.DB.Model(&models.Client{}).Where("deleted_at IS NULL AND user_id IS NOT NULL").Count(&activeClients)

	var totalUsers int64
	var approvedManagers int64
	var pendingApprovals int64
	database.DB.Model(&models.User{}).Where("deleted_at IS NULL").Count(&totalUsers)
	database.DB.Model(&models.User{}).Where("role IN ? AND approved = ? AND deleted_at IS NULL", []string{string(models.RoleManager), string(models.RoleAdmin)}, true).Count(&approvedManagers)
	database.DB.Model(&models.User{}).Where("role IN ? AND approved = ? AND deleted_at IS NULL", []string{string(models.RoleManager), string(models.RoleAdmin)}, false).Count(&pendingApprovals)

	var clientsCount int64
	var managersCount int64
	var adminsCount int64
	database.DB.Model(&models.User{}).Where("role = ? AND deleted_at IS NULL", models.RoleClient).Count(&clientsCount)
	database.DB.Model(&models.User{}).Where("role = ? AND deleted_at IS NULL", models.RoleManager).Count(&managersCount)
	database.DB.Model(&models.User{}).Where("role = ? AND deleted_at IS NULL", models.RoleAdmin).Count(&adminsCount)

	var totalEquipment int64
	var availableEquipment int64
	var leasedEquipment int64
	var totalEquipmentValue float64

	database.DB.Model(&models.Equipment{}).Where("deleted_at IS NULL").Count(&totalEquipment)
	database.DB.Model(&models.Equipment{}).Where("status = ? AND deleted_at IS NULL", "available").Count(&availableEquipment)
	database.DB.Model(&models.Equipment{}).Where("status = ? AND deleted_at IS NULL", "in_lease").Count(&leasedEquipment)

	var equipmentList []models.Equipment
	database.DB.Where("deleted_at IS NULL").Find(&equipmentList)
	for _, eq := range equipmentList {
		totalEquipmentValue += eq.Cost
	}

	type EquipmentTypeStats struct {
		Type  string
		Count int64
		Value float64
	}
	var typeStats []EquipmentTypeStats
	database.DB.Model(&models.Equipment{}).
		Select("type, COUNT(*) as count, SUM(cost) as value").
		Where("deleted_at IS NULL").
		Group("type").
		Scan(&typeStats)

	type EquipmentStatusStats struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}
	var statusStats []EquipmentStatusStats
	database.DB.Model(&models.Equipment{}).
		Select("status, COUNT(*) as count").
		Where("deleted_at IS NULL").
		Group("status").
		Scan(&statusStats)

	var totalContracts int64
	var pendingContracts int64
	var activeContracts int64
	var completedContracts int64
	var totalContractValue float64
	var totalMonthlyRevenue float64

	database.DB.Model(&models.Contract{}).Where("deleted_at IS NULL").Count(&totalContracts)
	database.DB.Model(&models.Contract{}).Where("status = ? AND deleted_at IS NULL", models.ContractStatusPending).Count(&pendingContracts)
	database.DB.Model(&models.Contract{}).Where("status = ? AND deleted_at IS NULL", models.ContractStatusActive).Count(&activeContracts)
	database.DB.Model(&models.Contract{}).Where("status = ? AND deleted_at IS NULL", models.ContractStatusCompleted).Count(&completedContracts)

	var contracts []models.Contract
	database.DB.Where("deleted_at IS NULL").Find(&contracts)
	for _, contract := range contracts {
		totalContractValue += contract.TotalAmount
		if contract.Status == models.ContractStatusActive {
			totalMonthlyRevenue += contract.MonthlyPayment
		}
	}

	var avgContractMonths float64
	if totalContracts > 0 {
		var totalMonths int64
		for _, contract := range contracts {
			years := contract.EndDate.Year() - contract.StartDate.Year()
			months := contract.EndDate.Month() - contract.StartDate.Month()
			contractMonths := years*12 + int(months)
			if contract.EndDate.Day() < contract.StartDate.Day() {
				contractMonths--
			}
			if contractMonths < 1 {
				contractMonths = 1
			}
			totalMonths += int64(contractMonths)
		}
		avgContractMonths = float64(totalMonths) / float64(totalContracts)
	}

	var avgWaitingTime float64
	if pendingContracts > 0 {
		var pendingContractsList []models.Contract
		database.DB.Where("status = ? AND deleted_at IS NULL", models.ContractStatusPending).Find(&pendingContractsList)
		if len(pendingContractsList) > 0 {
			var totalDays float64
			for _, contract := range pendingContractsList {
				days := time.Since(contract.CreatedAt).Hours() / 24
				totalDays += days
			}
			avgWaitingTime = totalDays / float64(len(pendingContractsList))
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"clients": gin.H{
			"total":  totalClients,
			"active": activeClients,
		},
		"users": gin.H{
			"total":           totalUsers,
			"approved_admins": approvedManagers,
			"pending":         pendingApprovals,
		},
		"roles": gin.H{
			"clients":  clientsCount,
			"managers": managersCount,
			"admins":   adminsCount,
		},
		"equipment": gin.H{
			"total":       totalEquipment,
			"available":   availableEquipment,
			"leased":      leasedEquipment,
			"total_value": totalEquipmentValue,
			"by_type":     typeStats,
			"by_status":   statusStats,
		},
		"contracts": gin.H{
			"total":                 totalContracts,
			"pending":               pendingContracts,
			"active":                activeContracts,
			"completed":             completedContracts,
			"total_value":           totalContractValue,
			"monthly_income":        totalMonthlyRevenue,
			"avg_waiting_time_days": avgWaitingTime,
			"avg_months":            avgContractMonths,
		},
	})
}
