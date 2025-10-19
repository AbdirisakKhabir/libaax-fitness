// app/api/customer/[id]/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const prisma = new PrismaClient();

async function uploadToCloudinary(file, resourceType = "image") {
  try {
    if (!file || file.size === 0) {
      throw new Error("No file provided or file is empty");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    return new Promise((resolve, reject) => {
      const { Readable } = require("stream");

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "libaax-fitness",
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("Cloudinary upload successful:", result.secure_url);
            resolve(result.secure_url);
          }
        }
      );

      const readableStream = Readable.from(buffer);
      readableStream.pipe(uploadStream);
    });
  } catch (error) {
    console.error("Error in uploadToCloudinary:", error);
    throw error;
  }
}

function parseDate(dateString) {
  if (!dateString) return null;

  let date;

  if (dateString.includes("T")) {
    date = new Date(dateString);
  } else {
    date = new Date(dateString + "T00:00:00.000Z");
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  return date;
}

// GET - Fetch single customer by ID
export async function GET(request, { params }) {
  try {
    // Convert string ID to number
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID format" },
        { status: 400 }
      );
    }

    console.log("GET customer by ID:", customerId);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update customer
export async function PUT(request, { params }) {
  try {
    // Convert string ID to number
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID format" },
        { status: 400 }
      );
    }

    console.log("📥 PUT request for customer ID:", customerId);

    const formData = await request.formData();

    const name = formData.get("name");
    const phone = formData.get("phone");
    const registerDate = formData.get("registerDate");
    const expireDate = formData.get("expireDate");
    const fee = formData.get("fee");
    const gender = formData.get("gender");
    const image = formData.get("image");

    console.log("📋 Update form data received");

    // Validate required fields
    if (!name || !registerDate || !fee || !gender) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Check if customer exists - use numeric ID
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    let imageUrl = existingCustomer.image;

    // Handle image upload only if a new image is provided
    if (image && image instanceof File && image.size > 0) {
      try {
        console.log("🖼️ Uploading new image to Cloudinary...");
        imageUrl = await uploadToCloudinary(image, "image");
      } catch (uploadError) {
        console.error("❌ Image upload failed:", uploadError);
        imageUrl = existingCustomer.image;
      }
    }

    // Parse dates and fee
    const registerDateObj = parseDate(registerDate);
    const expireDateObj = parseDate(expireDate);
    const feeNumber = parseFloat(fee);

    if (isNaN(feeNumber)) {
      return NextResponse.json(
        { error: "Fee must be a valid number" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      name: name,
      phone: phone && phone.trim() !== "" ? phone : null,
      registerDate: registerDateObj,
      expireDate: expireDateObj,
      fee: feeNumber,
      gender: gender,
      image: imageUrl,
      updatedAt: new Date(),
    };

    console.log("💾 Updating customer:", updateData);

    // Update customer - use numeric ID
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    console.log("✅ Customer updated successfully");

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("❌ Error updating customer:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Phone number already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Customer update failed: " + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Remove customer
export async function DELETE(request, { params }) {
  try {
    // Convert string ID to number
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID format" },
        { status: 400 }
      );
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json(
      { message: "Customer deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export const dynamic = "force-dynamic";
