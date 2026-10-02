// Counts the dogs in each photo with Apple's Vision framework (animal recognition), on this Mac.
// Prints one line per photo: "<count>\t<path>". A dog is any animal Vision labels "Dog" with confidence >= 0.3.
// Usage: swift scripts/vision/count-dogs.swift <photo> [<photo> ...]
import CoreImage
import Foundation
import Vision

for path in CommandLine.arguments.dropFirst() {
  let url = URL(fileURLWithPath: path)
  guard let image = CIImage(contentsOf: url) else { print("-1\t\(path)"); continue }
  let request = VNRecognizeAnimalsRequest()
  do {
    try VNImageRequestHandler(ciImage: image).perform([request])
    let dogs = (request.results ?? []).filter { o in o.labels.contains { $0.identifier == "Dog" && $0.confidence >= 0.3 } }
    print("\(dogs.count)\t\(path)")
  } catch {
    print("-1\t\(path)")
  }
}
