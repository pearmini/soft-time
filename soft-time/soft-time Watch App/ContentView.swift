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
    private let blur: Double = 5
    private let colors: [Color] = [
        Color(red: 0xfd/255.0, green: 0xe7/255.0, blue: 0x25/255.0), // #fde725
        Color(red: 0x5e/255.0, green: 0xc9/255.0, blue: 0x62/255.0), // #5ec962
        Color(red: 0x21/255.0, green: 0x91/255.0, blue: 0x8c/255.0), // #21918c
        Color(red: 0x3b/255.0, green: 0x52/255.0, blue: 0x8b/255.0), // #3b528b
        Color(red: 0x44/255.0, green: 0x01/255.0, blue: 0x54/255.0)  // #440154
    ]
    
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
