import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';

/// Full-screen front-camera selfie capture. Pops with the captured JPEG bytes
/// ([Uint8List]) on success, or `null` if the user cancels.
///
/// [ResolutionPreset.medium] keeps the JPEG (and resulting base64) moderate in
/// size for the JSON payload.
class SelfieCapturePage extends StatefulWidget {
  const SelfieCapturePage({super.key, required this.title});

  /// e.g. "Clock In" / "Clock Out".
  final String title;

  @override
  State<SelfieCapturePage> createState() => _SelfieCapturePageState();
}

class _SelfieCapturePageState extends State<SelfieCapturePage>
    with WidgetsBindingObserver {
  CameraController? _controller;
  Future<void>? _initFuture;
  bool _isCapturing = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initFuture = _setupCamera();
  }

  Future<void> _setupCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() => _error = 'No camera is available on this device.');
        return;
      }
      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      final controller = CameraController(
        front,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );
      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() => _controller = controller);
    } on CameraException catch (e) {
      setState(() => _error = e.description ?? 'Unable to start the camera.');
    }
  }

  Future<void> _capture() async {
    final controller = _controller;
    if (controller == null ||
        !controller.value.isInitialized ||
        _isCapturing) {
      return;
    }
    setState(() => _isCapturing = true);
    try {
      final file = await controller.takePicture();
      final bytes = await file.readAsBytes();
      if (!mounted) return;
      Navigator.of(context).pop<Uint8List>(bytes);
    } on CameraException catch (e) {
      if (!mounted) return;
      setState(() {
        _isCapturing = false;
        _error = e.description ?? 'Failed to capture the photo.';
      });
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(widget.title),
      ),
      body: _error != null
          ? _CameraError(message: _error!)
          : FutureBuilder<void>(
              future: _initFuture,
              builder: (context, snapshot) {
                final controller = _controller;
                if (controller == null || !controller.value.isInitialized) {
                  return const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  );
                }
                return _CameraView(
                  controller: controller,
                  isCapturing: _isCapturing,
                  onCapture: _capture,
                );
              },
            ),
    );
  }
}

class _CameraView extends StatelessWidget {
  const _CameraView({
    required this.controller,
    required this.isCapturing,
    required this.onCapture,
  });

  final CameraController controller;
  final bool isCapturing;
  final VoidCallback onCapture;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.bottomCenter,
      children: [
        Positioned.fill(child: CameraPreview(controller)),
        Padding(
          padding: const EdgeInsets.only(bottom: 40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Center your face and capture',
                style: TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 16),
              GestureDetector(
                onTap: isCapturing ? null : onCapture,
                child: Container(
                  height: 72,
                  width: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    border: Border.all(color: Colors.white70, width: 4),
                  ),
                  child: isCapturing
                      ? const Padding(
                          padding: EdgeInsets.all(18),
                          child: CircularProgressIndicator(strokeWidth: 3),
                        )
                      : const Icon(Icons.camera_alt_rounded,
                          color: Colors.black, size: 32),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CameraError extends StatelessWidget {
  const _CameraError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.videocam_off_rounded,
                color: Colors.white70, size: 56),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white),
            ),
            const SizedBox(height: 20),
            OutlinedButton(
              style: OutlinedButton.styleFrom(foregroundColor: Colors.white),
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Go back'),
            ),
          ],
        ),
      ),
    );
  }
}
