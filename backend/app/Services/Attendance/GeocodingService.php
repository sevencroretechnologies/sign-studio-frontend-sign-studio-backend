<?php

namespace App\Services\Attendance;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GeocodingService
{
    /**
     * Reverse geocode coordinates to establishment/business/building name + formatted address.
     * Uses Google Places Nearby Search API (rankby=distance & type=establishment) + Google Geocoding API.
     */
    public function reverseGeocode($latitude, $longitude): string
    {
        if (is_null($latitude) || is_null($longitude) || ((float)$latitude == 0.0 && (float)$longitude == 0.0)) {
            return "Location unavailable";
        }

        $lat = round((float)$latitude, 6);
        $lng = round((float)$longitude, 6);

        // Cache lookup per coordinate pair for 30 days
        $cacheKey = "geo_place_establishment_v1_{$lat}_{$lng}";

        return Cache::remember($cacheKey, 60 * 24 * 30, function () use ($lat, $lng) {
            $apiKey = env('GOOGLE_MAPS_API_KEY');

            if ($apiKey) {
                try {
                    $establishmentName = null;
                    $formattedAddress = null;

                    // 1. Google Places Nearby Search API with rankby=distance & type=establishment
                    $placesResponse = Http::timeout(5)->get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', [
                        'location' => "{$lat},{$lng}",
                        'rankby' => 'distance',
                        'type' => 'establishment',
                        'key' => $apiKey,
                    ]);

                    if ($placesResponse->successful()) {
                        $placesData = $placesResponse->json();
                        if (!empty($placesData['results'])) {
                            foreach ($placesData['results'] as $place) {
                                $types = $place['types'] ?? [];
                                if (!empty($place['name']) &&
                                    !in_array('route', $types) &&
                                    !in_array('locality', $types) &&
                                    !in_array('political', $types) &&
                                    !in_array('administrative_area_level_1', $types) &&
                                    !in_array('administrative_area_level_2', $types) &&
                                    !in_array('postal_code', $types)) {
                                    $establishmentName = $place['name'];
                                    break;
                                }
                            }

                            if (!$establishmentName && !empty($placesData['results'][0]['name'])) {
                                $establishmentName = $placesData['results'][0]['name'];
                            }
                        }
                    } else {
                        Log::warning("Google Places API Response Error: " . $placesResponse->body());
                    }

                    // 2. Google Reverse Geocoding API for standard formatted address
                    $geocodeResponse = Http::timeout(5)->get('https://maps.googleapis.com/maps/api/geocode/json', [
                        'latlng' => "{$lat},{$lng}",
                        'key' => $apiKey,
                    ]);

                    if ($geocodeResponse->successful()) {
                        $geocodeData = $geocodeResponse->json();
                        if (!empty($geocodeData['results'][0]['formatted_address'])) {
                            $formattedAddress = $geocodeData['results'][0]['formatted_address'];

                            // If Places API didn't return an establishment name, check address_components for premise/establishment
                            if (!$establishmentName) {
                                foreach ($geocodeData['results'] as $result) {
                                    $types = $result['types'] ?? [];
                                    if (array_intersect(['establishment', 'point_of_interest', 'premise', 'subpremise', 'building'], $types)) {
                                        foreach ($result['address_components'] as $component) {
                                            if (array_intersect(['establishment', 'premise', 'point_of_interest', 'building'], $component['types'])) {
                                                $establishmentName = $component['long_name'];
                                                break 2;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        Log::warning("Google Geocoding API Response Error: " . $geocodeResponse->body());
                    }

                    if ($establishmentName && $formattedAddress) {
                        if (str_starts_with(trim($formattedAddress), trim($establishmentName))) {
                            return $formattedAddress;
                        }
                        return "{$establishmentName}\n{$formattedAddress}";
                    } elseif ($establishmentName) {
                        return $establishmentName;
                    } elseif ($formattedAddress) {
                        return $formattedAddress;
                    }
                } catch (\Throwable $e) {
                    Log::error("Google Places/Geocoding API Exception: " . $e->getMessage());
                }
            }

            // Fallback to OpenStreetMap (Nominatim) if Google API Key is missing or fails
            try {
                $response = Http::timeout(4)
                    ->withHeaders(['User-Agent' => 'SignStudio-HRMS/1.0'])
                    ->get('https://nominatim.openstreetmap.org/reverse', [
                        'format' => 'jsonv2',
                        'lat' => $lat,
                        'lon' => $lng,
                        'addressdetails' => 1,
                    ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $address = $data['address'] ?? [];
                    $establishmentName = $data['name'] ?? 
                                        $address['building'] ?? 
                                        $address['amenity'] ?? 
                                        $address['office'] ?? 
                                        $address['shop'] ?? 
                                        $address['house_name'] ?? 
                                        $address['commercial'] ?? 
                                        null;
                    $formattedAddress = $data['display_name'] ?? null;

                    if ($establishmentName && $formattedAddress) {
                        if (str_starts_with(trim($formattedAddress), trim($establishmentName))) {
                            return $formattedAddress;
                        }
                        return "{$establishmentName}\n{$formattedAddress}";
                    } elseif ($formattedAddress) {
                        return $formattedAddress;
                    }
                }
            } catch (\Throwable $e) {
                Log::error("Nominatim Geocoding Exception: " . $e->getMessage());
            }

            return "Location unavailable";
        });
    }
}
