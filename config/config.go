package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Database DatabaseConfig
	Server   ServerConfig
	JWT      JWTConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type ServerConfig struct {
	Port string
	Host string
}

type JWTConfig struct {
	SecretKey string
	ExpiresIn int // в часах
}

func Load() *Config {
	envPaths := []string{".env", "./.env"}
	var envLoaded bool
	for _, path := range envPaths {
		if err := godotenv.Load(path); err == nil {
			log.Printf("Loaded .env file from: %s", path)
			envLoaded = true
			break
		}
	}

	if !envLoaded {
		if wd, err := os.Getwd(); err == nil {
			envPath := wd + "/.env"
			if err := godotenv.Load(envPath); err == nil {
				log.Printf("Загружаем .env файл из директории: %s", envPath)
				envLoaded = true
			}
		}
	}

	if !envLoaded {
		log.Println(".env файлы не найдены, используйте переменные из переменного окружения или загрузите свои")
	} else {
		if pwd := os.Getenv("DB_PASSWORD"); pwd != "" {
			log.Printf("DB_PASSWORD загружен из .env (length: %d)", len(pwd))
		} else {
			log.Println("ОШИБКА: DB_PASSWORD не найден в окружении .env")
		}
	}

	cfg := &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "leasing_db"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8082"),
			Host: getEnv("SERVER_HOST", "0.0.0.0"),
		},
		JWT: JWTConfig{
			SecretKey: getEnv("JWT_SECRET", ""),
			ExpiresIn: 24,
		},
	}

	log.Printf("Database config: host=%s, port=%s, user=%s, dbname=%s, password_length=%d",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.DBName, len(cfg.Database.Password))

	envHost := os.Getenv("DB_HOST")
	envPwd := os.Getenv("DB_PASSWORD")
	log.Printf("ОШИБКА: DB_HOST from env='%s', DB_PASSWORD from env length=%d", envHost, len(envPwd))

	if cfg.Database.Host == "localhost" {
		log.Println("ОШИБКА: DB_HOST is 'localhost', меняем принудительно на '127.0.0.1' чтобы предотвратить IPV6 ошибки")
		cfg.Database.Host = "127.0.0.1"
	}

	if cfg.JWT.SecretKey == "" {
		log.Fatal("ОШИБКА: JWT_SECRET не задан, укажите его в .env или в переменных окружения")
	}

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
