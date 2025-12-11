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
    private let blur: Double = 2
    @State private var currentPaletteIndex: Double = 0
    
    // Different seed for each of the 6 palettes
    private var seed: Double {
        let index = Int(currentPaletteIndex.rounded())
        let clampedIndex = max(0, min(index, 5))
        // Each palette gets a unique seed
        return 100.0 + Double(clampedIndex) * 23.7
    }
    
    // All 6 color palettes
    private let colorPalettes: [[Color]] = [
        // Palette 1: Red to yellow gradient
        [
            Color(red: 128/255.0, green: 0/255.0, blue: 38/255.0),
            Color(red: 225/255.0, green: 30/255.0, blue: 32/255.0),
            Color(red: 253/255.0, green: 137/255.0, blue: 60/255.0),
            Color(red: 254/255.0, green: 214/255.0, blue: 118/255.0),
            Color(red: 255/255.0, green: 255/255.0, blue: 204/255.0)
        ],
        // Palette 2: Purple to yellow
        [
            Color(red: 106/255.0, green: 23/255.0, blue: 110/255.0), // #6a176e
            Color(red: 177/255.0, green: 50/255.0, blue: 90/255.0),  // #b1325a
            Color(red: 234/255.0, green: 99/255.0, blue: 42/255.0),  // #ea632a
            Color(red: 252/255.0, green: 178/255.0, blue: 22/255.0), // #fcb216
            Color(red: 252/255.0, green: 255/255.0, blue: 164/255.0) // #fcffa4
        ],
        // Palette 3: Purple to green to yellow
        [
            Color(red: 72/255.0, green: 36/255.0, blue: 117/255.0),  // #482475
            Color(red: 49/255.0, green: 102/255.0, blue: 142/255.0), // #31668e
            Color(red: 30/255.0, green: 156/255.0, blue: 137/255.0), // #1e9c89
            Color(red: 108/255.0, green: 205/255.0, blue: 90/255.0), // #6ccd5a
            Color(red: 253/255.0, green: 231/255.0, blue: 37/255.0) // #fde725
        ],
        // Palette 4: Teal to pink to purple
        [
            Color(red: 22/255.0, green: 83/255.0, blue: 76/255.0),
            Color(red: 75/255.0, green: 120/255.0, blue: 48/255.0),
            Color(red: 176/255.0, green: 121/255.0, blue: 88/255.0),
            Color(red: 212/255.0, green: 142/255.0, blue: 195/255.0),
            Color(red: 193/255.0, green: 202/255.0, blue: 243/255.0)
        ],
        // Palette 5: Deep purple to yellow
        [
            Color(red: 65/255.0, green: 4/255.0, blue: 157/255.0),   // #41049d
            Color(red: 153/255.0, green: 21/255.0, blue: 159/255.0),  // #99159f
            Color(red: 214/255.0, green: 85/255.0, blue: 109/255.0), // #d6556d
            Color(red: 250/255.0, green: 158/255.0, blue: 59/255.0), // #fa9e3b
            Color(red: 240/255.0, green: 249/255.0, blue: 33/255.0)   // #f0f921
        ],
        // Palette 6: Pink to purple gradient
        [
            Color(red: 183/255.0, green: 11/255.0, blue: 79/255.0),
            Color(red: 227/255.0, green: 56/255.0, blue: 144/255.0),
            Color(red: 208/255.0, green: 138/255.0, blue: 194/255.0),
            Color(red: 220/255.0, green: 201/255.0, blue: 226/255.0),
            Color(red: 247/255.0, green: 244/255.0, blue: 249/255.0)
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
                    // Black background
                    Color.black
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
        var prevColor = Color.black
        
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
