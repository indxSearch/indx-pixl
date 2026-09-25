// Run from the repository root: swift editor/desktop/assets/generate-icon.swift
import AppKit
import Foundation

let directory = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
let iconset = directory.appendingPathComponent("Indx Pixl.iconset")
try FileManager.default.createDirectory(at: iconset, withIntermediateDirectories: true)
// Exact pixel geometry of raw-icons/indx.svg, top to bottom.
let logo = ["0100010", "1000001", "0011100", "1000001", "0100010"]
func render(_ size: Int) -> Data {
    let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    let context = NSGraphicsContext(bitmapImageRep: bitmap)!
    NSGraphicsContext.current = context
    let scale = CGFloat(size) / 1024
    context.cgContext.scaleBy(x: scale, y: scale)
    NSColor(srgbRed: 18/255, green: 18/255, blue: 21/255, alpha: 1).setFill()
    NSBezierPath(roundedRect: NSRect(x: 64, y: 64, width: 896, height: 896), xRadius: 196, yRadius: 196).fill()
    NSColor(srgbRed: 251/255, green: 251/255, blue: 251/255, alpha: 1).setFill()
    let cell: CGFloat = 88
    for (row, pixels) in logo.enumerated() {
        for (column, pixel) in pixels.enumerated() where pixel == "1" {
            NSRect(x: 204 + CGFloat(column) * cell, y: 292 + CGFloat(4 - row) * cell, width: cell, height: cell).fill()
        }
    }
    NSGraphicsContext.restoreGraphicsState()
    return bitmap.representation(using: .png, properties: [:])!
}
for size in [16, 32, 128, 256, 512] {
    for multiplier in [1, 2] {
        let suffix = multiplier == 2 ? "@2x" : ""
        try render(size * multiplier).write(to: iconset.appendingPathComponent("icon_\(size)x\(size)\(suffix).png"))
    }
}
try render(1024).write(to: directory.appendingPathComponent("icon.png"))
let process = Process()
process.executableURL = URL(fileURLWithPath: "/usr/bin/iconutil")
process.arguments = ["-c", "icns", iconset.path, "-o", directory.appendingPathComponent("icon.icns").path]
try process.run()
process.waitUntilExit()
guard process.terminationStatus == 0 else { fatalError("iconutil failed") }
try FileManager.default.removeItem(at: iconset)
