package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// --- STRUKTUR DATA (MODEL) ---

// Model untuk User (Login/Register)
type User struct {
	Username string `json:"username" bson:"username"`
	Password string `json:"password" bson:"password"` // Catatan: Di aplikasi asli, password wajib di-enkripsi!
}

// Model untuk Lokasi Peta
type LocationData struct {
	Nama      string    `json:"nama" bson:"nama"`
	Latitude  float64   `json:"latitude" bson:"latitude"`
	Longitude float64   `json:"longitude" bson:"longitude"`
}

var db *mongo.Database

func main() {
	// 1. Load Environment Variables
	if err := godotenv.Load(); err != nil {
		log.Println("Info: File .env tidak ditemukan, menggunakan environment host")
	}

	// 2. Koneksi Database
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("Error: MONGO_URI tidak ditemukan di .env")
	}

	clientOptions := options.Client().ApplyURI(mongoURI)
	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		log.Fatal("Gagal konek ke MongoDB:", err)
	}

	// Pilih Database 'sig_db'
	db = client.Database("sig_db")
	fmt.Println("✅ Sukses terhubung ke MongoDB Atlas!")

	// 3. Setup Web Server (Fiber)
	app := fiber.New()
	app.Use(cors.New()) // Izin agar Frontend bisa akses Backend

	// --- ROUTES (JALUR API) ---

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Server SIG (User + Lokasi) Aktif! 🚀")
	})

	// === FITUR 1: AUTHENTICATION (Login/Register) ===

	// API: Register User Baru
	app.Post("/api/register", func(c *fiber.Ctx) error {
		var user User
		// Ambil data dari Frontend
		if err := c.BodyParser(&user); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Data tidak valid"})
		}

		// Cek apakah username sudah ada?
		var existingUser User
		collection := db.Collection("users")
		err := collection.FindOne(context.Background(), bson.M{"username": user.Username}).Decode(&existingUser)
		if err == nil {
			return c.Status(400).JSON(fiber.Map{"message": "Username sudah dipakai!"})
		}

		// Simpan User Baru
		_, err = collection.InsertOne(context.Background(), user)
		if err != nil {

			fmt.Println("❌ GAGAL PENYEBABNYA:", err)
			
			return c.Status(500).JSON(fiber.Map{"error": "Gagal daftar"})
		}

		return c.JSON(fiber.Map{"message": "Register Berhasil!", "username": user.Username})
	})

	// API: Login
	app.Post("/api/login", func(c *fiber.Ctx) error {
		var input User
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Data tidak valid"})
		}

		var dbUser User
		collection := db.Collection("users")
		// Cari user berdasarkan username
		err := collection.FindOne(context.Background(), bson.M{"username": input.Username}).Decode(&dbUser)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"message": "Username atau Password salah!"})
		}

		// Cek Password (Sederhana)
		if input.Password != dbUser.Password {
			return c.Status(401).JSON(fiber.Map{"message": "Username atau Password salah!"})
		}

		return c.JSON(fiber.Map{"message": "Login Sukses!", "username": dbUser.Username})
	})

	// === FITUR 2: MAPS (Lokasi) ===

	// API: Simpan Lokasi
	app.Post("/api/lokasi", func(c *fiber.Ctx) error {
		lokasi := new(LocationData)
		if err := c.BodyParser(lokasi); err != nil {
			return c.Status(400).SendString(err.Error())
		}
		
		_, err := db.Collection("lokasi").InsertOne(context.Background(), lokasi)
		if err != nil {
			return c.Status(500).SendString("Gagal simpan lokasi")
		}

		return c.JSON(fiber.Map{"message": "Lokasi disimpan!", "data": lokasi})
	})

	// API: Ambil Semua Lokasi
	app.Get("/api/lokasi", func(c *fiber.Ctx) error {
		var hasil []LocationData
		cursor, err := db.Collection("lokasi").Find(context.Background(), bson.M{})
		if err != nil {
			return c.Status(500).SendString("Gagal ambil data")
		}
		cursor.All(context.Background(), &hasil)
		return c.JSON(hasil)
	})

	// Jalankan Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	log.Fatal(app.Listen(":" + port))
}