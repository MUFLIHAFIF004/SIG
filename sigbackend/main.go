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
	"go.mongodb.org/mongo-driver/bson/primitive" // Import Penting untuk ID
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Model User
type User struct {
	Username string `json:"username" bson:"username"`
	Password string `json:"password" bson:"password"`
}

// Model Lokasi (Sekarang pakai ID)
type LocationData struct {
	ID        primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	Nama      string             `json:"nama" bson:"nama"`
	Latitude  float64            `json:"latitude" bson:"latitude"`
	Longitude float64            `json:"longitude" bson:"longitude"`
}

var db *mongo.Database

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Info: File .env tidak ditemukan, menggunakan environment host")
	}

	mongoURI := os.Getenv("MONGO_URI")
	clientOptions := options.Client().ApplyURI(mongoURI)
	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		log.Fatal("Gagal konek ke MongoDB:", err)
	}

	db = client.Database("sig_db")
	fmt.Println("✅ Sukses terhubung ke MongoDB Atlas!")

	app := fiber.New()
	app.Use(cors.New())

	// --- ROUTES ---

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Server SIG CRUD Aktif! 🚀")
	})

	// Login & Register (Sama seperti sebelumnya)
	app.Post("/api/register", func(c *fiber.Ctx) error {
		var user User
		if err := c.BodyParser(&user); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Data tidak valid"})
		}
		var existingUser User
		err := db.Collection("users").FindOne(context.Background(), bson.M{"username": user.Username}).Decode(&existingUser)
		if err == nil {
			return c.Status(400).JSON(fiber.Map{"message": "Username sudah dipakai!"})
		}
		_, err = db.Collection("users").InsertOne(context.Background(), user)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Gagal daftar"})
		}
		return c.JSON(fiber.Map{"message": "Register Berhasil!", "username": user.Username})
	})

	app.Post("/api/login", func(c *fiber.Ctx) error {
		var input User
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Data tidak valid"})
		}
		var dbUser User
		err := db.Collection("users").FindOne(context.Background(), bson.M{"username": input.Username}).Decode(&dbUser)
		if err != nil || input.Password != dbUser.Password {
			return c.Status(401).JSON(fiber.Map{"message": "Username atau Password salah!"})
		}
		return c.JSON(fiber.Map{"message": "Login Sukses!", "username": dbUser.Username})
	})

	// === CRUD PETA ===

	// 1. CREATE (Simpan)
	app.Post("/api/map", func(c *fiber.Ctx) error {
		lokasi := new(LocationData)
		if err := c.BodyParser(lokasi); err != nil {
			return c.Status(400).SendString(err.Error())
		}
		
		// Insert dan dapatkan ID baru
		result, err := db.Collection("lokasi").InsertOne(context.Background(), lokasi)
		if err != nil {
			return c.Status(500).SendString("Gagal simpan lokasi")
		}

		// Kirim balik ID yang baru dibuat ke frontend
		lokasi.ID = result.InsertedID.(primitive.ObjectID)
		
		return c.JSON(fiber.Map{"message": "Lokasi disimpan!", "data": lokasi})
	})

	// 2. READ (Ambil Semua)
	app.Get("/api/map", func(c *fiber.Ctx) error {
		var hasil []LocationData
		cursor, err := db.Collection("lokasi").Find(context.Background(), bson.M{})
		if err != nil {
			return c.Status(500).SendString("Gagal ambil data")
		}
		if err = cursor.All(context.Background(), &hasil); err != nil {
			return c.Status(500).SendString("Gagal parsing data")
		}
		return c.JSON(hasil)
	})

	// 3. UPDATE (Edit Nama ATAU Posisi)
	app.Put("/api/map/:id", func(c *fiber.Ctx) error {
		idParam := c.Params("id")
		objID, err := primitive.ObjectIDFromHex(idParam)
		if err != nil {
			return c.Status(400).SendString("ID tidak valid")
		}

		// Kita pakai map[string]interface{} agar fleksibel
		// Bisa update nama saja, atau lat/long saja
		var updateData map[string]interface{}

		if err := c.BodyParser(&updateData); err != nil {
			return c.Status(400).SendString("Data tidak valid")
		}

		// Siapkan data yang mau diupdate ke MongoDB
		updateFields := bson.M{}

		if nama, ok := updateData["nama"]; ok {
			updateFields["nama"] = nama
		}
		if lat, ok := updateData["latitude"]; ok {
			updateFields["latitude"] = lat
		}
		if lng, ok := updateData["longitude"]; ok {
			updateFields["longitude"] = lng
		}

		// Lakukan Update
		_, err = db.Collection("lokasi").UpdateOne(
			context.Background(),
			bson.M{"_id": objID},
			bson.M{"$set": updateFields},
		)
		if err != nil {
			return c.Status(500).SendString("Gagal update data")
		}

		return c.JSON(fiber.Map{"message": "Data berhasil diupdate!"})
	})

	// 4. DELETE (Hapus Lokasi)
	app.Delete("/api/map/:id", func(c *fiber.Ctx) error {
		idParam := c.Params("id")
		objID, err := primitive.ObjectIDFromHex(idParam)
		if err != nil {
			return c.Status(400).SendString("ID tidak valid")
		}

		_, err = db.Collection("lokasi").DeleteOne(context.Background(), bson.M{"_id": objID})
		if err != nil {
			return c.Status(500).SendString("Gagal hapus data")
		}

		return c.JSON(fiber.Map{"message": "Data berhasil dihapus!"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	log.Fatal(app.Listen(":" + port))
}