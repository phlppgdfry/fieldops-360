import Foundation
import Vision
import AppKit
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["nl-NL", "en-US"]
request.usesLanguageCorrection = true
try VNImageRequestHandler(url: url).perform([request])
let rows = (request.results ?? []).compactMap { o -> [String:Any]? in
 guard let c = o.topCandidates(1).first else { return nil }
 return ["text":c.string,"confidence":c.confidence]
}
let data = try JSONSerialization.data(withJSONObject: rows)
print(String(data:data,encoding:.utf8)!)
