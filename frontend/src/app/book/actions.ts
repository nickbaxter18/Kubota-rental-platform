'use server';

import { apiClient } from '@/lib/api-client';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

// Validation schema for booking form
const bookingSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  deliveryCity: z.string().min(1, 'City is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerName: z.string().min(1, 'Customer name is required'),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingResult {
  success: boolean;
  bookingNumber?: string;
  error?: string;
  pricing?: {
    dailyRate: number;
    days: number;
    subtotal: number;
    taxes: number;
    floatFee: number;
    total: number;
  };
}

// Server Action for creating a booking
export async function createBooking(formData: FormData): Promise<BookingResult> {
  try {
    // Extract and validate form data
    const rawData = {
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      deliveryAddress: formData.get('deliveryAddress') as string,
      deliveryCity: formData.get('deliveryCity') as string,
      customerEmail: formData.get('customerEmail') as string,
      customerName: formData.get('customerName') as string,
    };

    const validatedData = bookingSchema.parse(rawData);

    // Validate date logic
    const startDateObj = new Date(validatedData.startDate);
    const endDateObj = new Date(validatedData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDateObj < today) {
      return {
        success: false,
        error: 'Start date must be today or later',
      };
    }

    if (endDateObj <= startDateObj) {
      return {
        success: false,
        error: 'End date must be after start date',
      };
    }

    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      return {
        success: false,
        error: 'Maximum rental period is 1 year',
      };
    }

    // Get equipment details and check availability
    const equipmentResponse = await apiClient.getEquipmentList({
      available: true,
      limit: 1
    });

    if (!equipmentResponse.data.equipment || equipmentResponse.data.equipment.length === 0) {
      return {
        success: false,
        error: 'No equipment available. Please contact support.',
      };
    }

    const equipment = equipmentResponse.data.equipment[0];
    const equipmentId = equipment.id;

    // Check availability for the selected dates
    const availabilityResponse = await apiClient.checkAvailability(
      equipmentId,
      validatedData.startDate,
      validatedData.endDate
    );

    if (!availabilityResponse.data.available) {
      return {
        success: false,
        error: 'Equipment is not available for these dates. Please select different dates.',
      };
    }

    // Calculate pricing based on equipment rates
    const dailyRate = equipment.dailyRate || 350;
    const subtotal = dailyRate * diffDays;
    const taxes = subtotal * 0.15; // 15% HST
    const floatFee = validatedData.deliveryCity ? 150 : 0;
    const total = subtotal + taxes + floatFee;

    // Create booking via API
    const bookingResponse = await apiClient.createBooking({
      equipmentId,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      deliveryAddress: validatedData.deliveryAddress,
      deliveryCity: validatedData.deliveryCity,
    });

    if (!bookingResponse.success) {
      return {
        success: false,
        error: bookingResponse.message || 'Failed to create booking. Please try again.',
      };
    }

    const booking = bookingResponse.data;

    // Revalidate cache tags to update availability
    revalidateTag('equipment-availability');
    revalidateTag(`equipment-${validatedData.startDate}-${validatedData.endDate}`);

    return {
      success: true,
      bookingNumber: booking.bookingNumber,
      pricing: {
        dailyRate,
        days: diffDays,
        subtotal,
        taxes,
        floatFee,
        total,
      },
    };

  } catch (error) {
    console.error('Booking creation error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Please check your form data and try again.',
      };
    }

    return {
      success: false,
      error: 'Failed to create booking. Please try again.',
    };
  }
}

// Server Action for checking equipment availability
export async function checkAvailability(startDate: string, endDate: string) {
  'use server';

  try {
    // Get available equipment
    const equipmentResponse = await apiClient.getEquipmentList({
      available: true,
      limit: 1
    });

    if (!equipmentResponse.data.equipment || equipmentResponse.data.equipment.length === 0) {
      return {
        available: false,
        message: 'No equipment available. Please contact support.',
      };
    }

    const equipmentId = equipmentResponse.data.equipment[0].id;

    // Check availability for the selected dates
    const availabilityResponse = await apiClient.checkAvailability(
      equipmentId,
      startDate,
      endDate
    );

    return {
      available: availabilityResponse.data.available,
      message: availabilityResponse.data.available
        ? 'Equipment is available for these dates'
        : 'Equipment is not available for these dates. Please select different dates.',
    };

  } catch (error) {
    console.error('Availability check error:', error);
    return {
      available: false,
      message: 'Unable to check availability. Please try again.',
    };
  }
}
