// Cuts the dog (every foreground subject) out of a photo with Apple's Vision framework, on this Mac.
// Writes a greyscale PNG mask the size of the photo: white = dog, black = background.
// Usage: swift scripts/vision/mask.swift <in.jpg|webp|png> <out-mask.png> [more in/out pairs...]
import AppKit
import CoreImage
import Vision

let args = Array(CommandLine.arguments.dropFirst())
guard args.count >= 2, args.count % 2 == 0 else {
  FileHandle.standardError.write("usage: mask.swift <in> <out> [<in> <out>...]\n".data(using: .utf8)!)
  exit(2)
}
let context = CIContext()
var failures = 0
for i in stride(from: 0, to: args.count, by: 2) {
  let input = URL(fileURLWithPath: args[i]), output = URL(fileURLWithPath: args[i + 1])
  guard let image = CIImage(contentsOf: input) else { print("unreadable: \(input.path)"); failures += 1; continue }
  let handler = VNImageRequestHandler(ciImage: image)
  let request = VNGenerateForegroundInstanceMaskRequest()
  do {
    try handler.perform([request])
    guard let result = request.results?.first else { print("no subject: \(input.lastPathComponent)"); failures += 1; continue }
    let buffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
    let mask = CIImage(cvPixelBuffer: buffer)
    try context.writePNGRepresentation(of: mask, to: output, format: .L8, colorSpace: CGColorSpaceCreateDeviceGray())
    print("ok: \(input.lastPathComponent) (\(result.allInstances.count) subject\(result.allInstances.count == 1 ? "" : "s"))")
  } catch {
    print("failed: \(input.lastPathComponent): \(error)"); failures += 1
  }
}
exit(failures == 0 ? 0 : 1)
