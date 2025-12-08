//
//  ContentView.swift
//  soft-time Watch App
//
//  Created by subairui on 12/8/25.
//

import SwiftUI

struct ContentView: View {
    @State private var startTime = Date()
    
    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.1)) { context in
            GeometryReader { geometry in
                ZStack {
                    // Background
                    Color.black
                        .ignoresSafeArea()
                    
                    // Gradient Circle
                    Circle()
                        .fill(
                            RadialGradient(
                                gradient: Gradient(colors: gradientColors(for: context.date)),
                                center: .center,
                                startRadius: 0,
                                endRadius: geometry.size.width * 0.6
                            )
                        )
                        .blur(radius: 20)
                        .frame(width: geometry.size.width * 0.8, height: geometry.size.width * 0.8)
                        .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
                }
            }
        }
        .onAppear {
            startTime = Date()
        }
    }
    
    private func gradientColors(for date: Date) -> [Color] {
        // Calculate color offset based on time elapsed since app start
        let elapsed = date.timeIntervalSince(startTime)
        let cycleDuration: Double = 30.0 // 30 seconds for a full color cycle
        let colorOffset = (elapsed / cycleDuration).truncatingRemainder(dividingBy: 1.0)
        
        let hue1 = colorOffset
        let hue2 = (colorOffset + 0.15).truncatingRemainder(dividingBy: 1.0)
        let hue3 = (colorOffset + 0.5).truncatingRemainder(dividingBy: 1.0)
        let hue4 = (colorOffset + 0.7).truncatingRemainder(dividingBy: 1.0)
        
        return [
            Color(hue: hue1, saturation: 0.3, brightness: 0.95), // Outer: light
            Color(hue: hue2, saturation: 0.6, brightness: 0.8),  // Mid-outer: golden
            Color(hue: hue3, saturation: 0.8, brightness: 0.7), // Mid-inner: magenta/purple
            Color(hue: hue4, saturation: 0.9, brightness: 0.5)  // Inner: deep blue
        ]
    }
}

#Preview {
    ContentView()
}
