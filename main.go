package main

import (
	"log"
	"os"

	"awesomeProject/config"
	"awesomeProject/database"
	"awesomeProject/handlers"
	"awesomeProject/middleware"
	"awesomeProject/utils"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	utils.InitJWT(cfg.JWT.SecretKey)

	if err := database.Connect(cfg); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if os.Getenv("GIN_MODE") != "debug" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()

	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	r.Static("/static", "./static")
	r.StaticFile("/favicon.ico", "./static/favicon.ico")

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	r.GET("/", func(c *gin.Context) {
		c.File("./static/index.html")
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "leasing-service",
		})
	})

	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		if len(path) >= 4 && path[:4] == "/api" {
			c.JSON(404, gin.H{"error": "Not found"})
			return
		}
		c.File("./static/index.html")
	})

	public := r.Group("/api/v1")
	{
		public.POST("/register", handlers.Register)
		public.POST("/login", handlers.Login)
		public.POST("/calculate-lease", handlers.CalculateLease)
	}

	protected := r.Group("/api/v1")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/profile", handlers.GetProfile)
		protected.PUT("/profile", handlers.UpdateProfile)

		protected.GET("/stats", handlers.GetStats)

		clients := protected.Group("/clients")
		{
			clients.POST("", handlers.CreateClient)
			clients.GET("", handlers.GetClients)
			clients.GET("/:id", handlers.GetClient)
			clients.PUT("/:id", handlers.UpdateClient)
			clients.DELETE("/:id", handlers.DeleteClient)
		}

		equipmentHandler := &handlers.EquipmentHandler{DB: database.DB}
		equipment := protected.Group("/equipment")
		{
			equipment.POST("", equipmentHandler.CreateEquipment)
			equipment.GET("", equipmentHandler.GetEquipmentList)
			equipment.GET("/:id", equipmentHandler.GetEquipmentByID)
			equipment.PUT("/:id", equipmentHandler.UpdateEquipment)
			equipment.DELETE("/:id", equipmentHandler.DeleteEquipment)
		}

		contracts := protected.Group("/contracts")
		{
			contracts.POST("", handlers.CreateContract)
			contracts.GET("", handlers.GetContracts)
			contracts.GET("/:id", handlers.GetContract)
			contracts.PUT("/:id", handlers.UpdateContract)
			contracts.DELETE("/:id", handlers.DeleteContract)
		}

		users := protected.Group("/users")
		{
			users.POST("", handlers.CreateUser)
			users.GET("", handlers.GetUsers)
			users.GET("/:id", handlers.GetUser)
			users.PUT("/:id", handlers.UpdateUser)
			users.DELETE("/:id", handlers.DeleteUser)
		}

	}

	addr := cfg.Server.Host + ":" + cfg.Server.Port
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
