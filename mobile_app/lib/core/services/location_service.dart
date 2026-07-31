import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

/// Raised when a fresh GPS fix cannot be obtained. [message] is user-facing.
class LocationException implements Exception {
  const LocationException(this.message);
  final String message;

  @override
  String toString() => 'LocationException: $message';
}

/// Obtains a fresh, high-accuracy GPS position for attendance. The backend
/// performs all geofence/accuracy validation — this only acquires coordinates.
class LocationService {
  const LocationService();

  Future<Position> getCurrentPosition() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw const LocationException(
        'Location services are turned off. Please enable GPS and try again.',
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied) {
      throw const LocationException(
        'Location permission is required to record attendance.',
      );
    }
    if (permission == LocationPermission.deniedForever) {
      throw const LocationException(
        'Location permission is permanently denied. Enable it in Settings to '
        'continue.',
      );
    }

    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
          timeLimit: Duration(seconds: 20),
        ),
      );
    } catch (_) {
      throw const LocationException(
        'Could not get your location. Please move to an open area and try '
        'again.',
      );
    }
  }
}

final locationServiceProvider =
    Provider<LocationService>((ref) => const LocationService());
