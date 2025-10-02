// targets/widget/index.swift
import WidgetKit
import SwiftUI

@main
struct SloGasWidgetBundle: WidgetBundle {
    var body: some Widget {
        // Only export the main display widget
        SloGasWidget()
    }
}