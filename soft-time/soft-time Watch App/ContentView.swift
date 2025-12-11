//
//  ContentView.swift
//  soft-time Watch App
//
//  Created by subairui on 12/8/25.
//

import SwiftUI

struct CircleData {
    let d: Double  // distance from previous circle center
    let r: Double  // radius
}

struct ContentView: View {
    private let seed: Double = 100
    private let blur: Double = 2
    @State private var currentPaletteIndex: Double = 0
    
    // All 6 color palettes
    private let colorPalettes: [[Color]] = [
        // Palette 1: Warm oranges/reds
        [
            Color(red: 253/255.0, green: 202/255.0, blue: 148/255.0),
            Color(red: 251/255.0, green: 151/255.0, blue: 100/255.0),
            Color(red: 233/255.0, green: 89/255.0, blue: 62/255.0),
            Color(red: 193/255.0, green: 21/255.0, blue: 14/255.0),
            Color(red: 127/255.0, green: 0/255.0, blue: 0/255.0)
        ],
        // Palette 2: Yellow to purple (viridis-like)
        [
            Color(red: 0xfd/255.0, green: 0xe7/255.0, blue: 0x25/255.0), // #fde725
            Color(red: 0x5e/255.0, green: 0xc9/255.0, blue: 0x62/255.0), // #5ec962
            Color(red: 0x21/255.0, green: 0x91/255.0, blue: 0x8c/255.0), // #21918c
            Color(red: 0x3b/255.0, green: 0x52/255.0, blue: 0x8b/255.0), // #3b528b
            Color(red: 0x44/255.0, green: 0x01/255.0, blue: 0x54/255.0)  // #440154
        ],
        // Palette 3: Greens
        [
            Color(red: 199/255.0, green: 232/255.0, blue: 155/255.0),
            Color(red: 130/255.0, green: 202/255.0, blue: 125/255.0),
            Color(red: 61/255.0, green: 162/255.0, blue: 88/255.0),
            Color(red: 15/255.0, green: 115/255.0, blue: 60/255.0),
            Color(red: 0/255.0, green: 69/255.0, blue: 41/255.0)
        ],
        // Palette 4: Blues
        [
            Color(red: 213/255.0, green: 238/255.0, blue: 179/255.0),
            Color(red: 115/255.0, green: 201/255.0, blue: 189/255.0),
            Color(red: 40/255.0, green: 151/255.0, blue: 191/255.0),
            Color(red: 35/255.0, green: 78/255.0, blue: 160/255.0),
            Color(red: 8/255.0, green: 29/255.0, blue: 88/255.0)
        ],
        // Palette 5: Teal/cyan
        [
            Color(red: 190/255.0, green: 201/255.0, blue: 226/255.0),
            Color(red: 117/255.0, green: 173/255.0, blue: 209/255.0),
            Color(red: 43/255.0, green: 142/255.0, blue: 178/255.0),
            Color(red: 2/255.0, green: 116/255.0, blue: 109/255.0),
            Color(red: 1/255.0, green: 70/255.0, blue: 54/255.0)
        ],
        // Palette 6: Pinks/purples
        [
            Color(red: 251/255.0, green: 181/255.0, blue: 188/255.0),
            Color(red: 246/255.0, green: 115/255.0, blue: 166/255.0),
            Color(red: 210/255.0, green: 42/255.0, blue: 145/255.0),
            Color(red: 143/255.0, green: 2/255.0, blue: 122/255.0),
            Color(red: 73/255.0, green: 0/255.0, blue: 106/255.0)
        ]
    ]
    
    private var colors: [Color] {
        let index = Int(currentPaletteIndex.rounded())
        let clampedIndex = max(0, min(index, colorPalettes.count - 1))
        return colorPalettes[clampedIndex]
    }
    
    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.016)) { timelineContext in
            GeometryReader { geometry in
                ZStack {
                    // White background
                    Color.white
                        .ignoresSafeArea()
                    
                    // Canvas with circles
                    Canvas { graphicsContext, size in
                        drawCircles(context: graphicsContext, size: size, date: timelineContext.date)
                    }
                }
            }
        }
        .focusable()
        .digitalCrownRotation(
            $currentPaletteIndex,
            from: 0,
            through: Double(colorPalettes.count - 1),
            by: 1,
            sensitivity: .medium,
            isContinuous: false,
            isHapticFeedbackEnabled: true
        )
    }
    
    private func createCircles(r: Double, count: Int, seed: Double) -> [CircleData] {
        var circles: [CircleData] = []
        var currentR = r
        var d: Double = 0
        
        // Simple seeded random using linear congruential generator approach
        var randomState = UInt64(seed * 1000)
        func random() -> Double {
            randomState = randomState &* 1103515245 &+ 12345
            return Double(randomState & 0x7FFFFFFF) / Double(0x7FFFFFFF)
        }
        
        func randomUniform(min: Double, max: Double) -> Double {
            return random() * (max - min) + min
        }
        
        for _ in 0..<count {
            circles.append(CircleData(d: d, r: currentR))
            d = randomUniform(min: 0.1, max: 0.2) * currentR
            let maxR = currentR - d
            currentR = randomUniform(min: 0.8, max: 0.9) * maxR
        }
        
        return circles
    }
    
    private func drawCircles(context: GraphicsContext, size: CGSize, date: Date) {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.hour, .minute, .second, .nanosecond], from: date)
        
        let hours = Double(components.hour ?? 0).truncatingRemainder(dividingBy: 12)
        let minutes = Double(components.minute ?? 0)
        let seconds = Double(components.second ?? 0)
        let milliseconds = Double(components.nanosecond ?? 0) / 1_000_000.0
        
        let startAngle = -Double.pi / 2
        let millisecondsAngle = (milliseconds / 1000.0) * 2 * Double.pi
        let secondsAngle = ((seconds * 1000.0 + milliseconds) / 60000.0) * 2 * Double.pi
        let minutesAngle = (minutes / 60.0) * 2 * Double.pi
        let hoursAngle = (hours / 12.0) * 2 * Double.pi
        let angles = [0.0, hoursAngle, minutesAngle, secondsAngle, millisecondsAngle]
        
        let baseRadius = min(size.width, size.height) / 2.0
        let r1 = baseRadius * 1.0
        
        // Create circles with actual pixel radius
        let circles = createCircles(r: r1, count: 5, seed: seed)
        
        // Calculate circle positions
        var cx = size.width / 2.0
        var cy = size.height / 2.0
        var positions: [(cx: Double, cy: Double)] = []
        
        for (i, circle) in circles.enumerated() {
            let angle = angles[i]
            cx += circle.d * cos(startAngle + angle)
            cy += circle.d * sin(startAngle + angle)
            positions.append((cx: cx, cy: cy))
        }
        
        // Draw circles with gradients
        var prevColor = Color.white
        
        for i in 0..<circles.count {
            let circle = circles[i]
            let color = colors[i]
            let pos = positions[i]
            let nextR = i + 1 < circles.count ? circles[i + 1].r : 0.0
            
            let circleRadius = circle.r
            let centerX = pos.cx
            let centerY = pos.cy
            
            // Create radial gradient
            let gradient = Gradient(stops: [
                .init(color: color, location: 0.0),
                .init(color: prevColor, location: 1.0)
            ])
            
            // Draw circle with blur effect using context effects
            var circleContext = context
            circleContext.addFilter(.blur(radius: blur))
            
            circleContext.fill(
                Path(ellipseIn: CGRect(
                    x: centerX - circleRadius,
                    y: centerY - circleRadius,
                    width: circleRadius * 2,
                    height: circleRadius * 2
                )),
                with: .radialGradient(
                    gradient,
                    center: CGPoint(x: pos.cx, y: pos.cy),
                    startRadius: nextR,
                    endRadius: circleRadius
                )
            )
            
            prevColor = color
        }
    }
}

#Preview {
    ContentView()
}
