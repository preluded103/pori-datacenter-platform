export class LocationGuesser {
    constructor(config) {
        this.config = config;
    }
    generateInitialBoundary() {
        try {
            const centerLat = this.config.siteCenter[0];
            const centerLng = this.config.siteCenter[1];
            const targetAreaM2 = this.config.targetArea;
            const ratio = 2;
            const width = Math.sqrt(targetAreaM2 / ratio);
            const length = width * ratio;
            const metersPerDegreeLat = 111320;
            const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);
            const halfWidthDeg = (width / 2) / metersPerDegreeLng;
            const halfLengthDeg = (length / 2) / metersPerDegreeLat;
            const rotationAngle = 10 * Math.PI / 180;
            const corners = [
                [-halfLengthDeg, -halfWidthDeg],
                [halfLengthDeg, -halfWidthDeg],
                [halfLengthDeg, halfWidthDeg],
                [-halfLengthDeg, halfWidthDeg]
            ];
            const rotatedCorners = corners.map(([x, y]) => {
                const rotatedX = x * Math.cos(rotationAngle) - y * Math.sin(rotationAngle);
                const rotatedY = x * Math.sin(rotationAngle) + y * Math.cos(rotationAngle);
                return [
                    centerLat + rotatedY,
                    centerLng + rotatedX
                ];
            });
            console.log('Generated initial boundary:', {
                center: this.config.siteCenter,
                targetArea: targetAreaM2,
                dimensions: { width: Math.round(width), length: Math.round(length) },
                coordinates: rotatedCorners
            });
            return rotatedCorners;
        }
        catch (error) {
            console.error('Error generating initial boundary:', error);
            return null;
        }
    }
    generateAlternativeBoundaries() {
        const alternatives = {};
        try {
            const centerLat = this.config.siteCenter[0];
            const centerLng = this.config.siteCenter[1];
            const phase1Area = this.config.phaseAreas.phase1.max;
            const phase1Boundary = this.generateRectangularBoundary(centerLat, centerLng, phase1Area, 1.5, 0);
            if (phase1Boundary) {
                alternatives['Phase I Only'] = phase1Boundary;
            }
            const squareBoundary = this.generateRectangularBoundary(centerLat, centerLng, this.config.targetArea, 1, 5);
            if (squareBoundary) {
                alternatives['Square Layout'] = squareBoundary;
            }
            const waterfrontBoundary = this.generateRectangularBoundary(centerLat, centerLng, this.config.targetArea, 3, 15);
            if (waterfrontBoundary) {
                alternatives['Waterfront Linear'] = waterfrontBoundary;
            }
            const gridOptimizedCenter = [
                centerLat + 0.001,
                centerLng - 0.002
            ];
            const gridBoundary = this.generateRectangularBoundary(gridOptimizedCenter[0], gridOptimizedCenter[1], this.config.targetArea, 2, 10);
            if (gridBoundary) {
                alternatives['Grid Optimized'] = gridBoundary;
            }
        }
        catch (error) {
            console.error('Error generating alternative boundaries:', error);
        }
        return alternatives;
    }
    generateRectangularBoundary(centerLat, centerLng, areaM2, ratio, rotationDegrees) {
        try {
            const width = Math.sqrt(areaM2 / ratio);
            const length = width * ratio;
            const metersPerDegreeLat = 111320;
            const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);
            const halfWidthDeg = (width / 2) / metersPerDegreeLng;
            const halfLengthDeg = (length / 2) / metersPerDegreeLat;
            const rotationAngle = rotationDegrees * Math.PI / 180;
            const corners = [
                [-halfLengthDeg, -halfWidthDeg],
                [halfLengthDeg, -halfWidthDeg],
                [halfLengthDeg, halfWidthDeg],
                [-halfLengthDeg, halfWidthDeg]
            ];
            return corners.map(([x, y]) => {
                const rotatedX = x * Math.cos(rotationAngle) - y * Math.sin(rotationAngle);
                const rotatedY = x * Math.sin(rotationAngle) + y * Math.cos(rotationAngle);
                return [
                    centerLat + rotatedY,
                    centerLng + rotatedX
                ];
            });
        }
        catch (error) {
            console.error('Error generating rectangular boundary:', error);
            return null;
        }
    }
    analyzeSiteConstraints() {
        return {
            recommendations: [
                'Position boundary to maximize waterfront access for cooling',
                'Align eastern edge with existing industrial infrastructure',
                'Maintain buffer from residential areas to the north',
                'Consider rail spur access from existing tracks',
                'Plan for Phase II expansion toward available industrial land'
            ],
            constraints: [
                'Kokemäenjoki river limits southern expansion',
                'Existing industrial facilities may restrict positioning',
                'Power grid access points constrain optimal placement',
                'Environmental regulations may affect waterfront development',
                'Transportation infrastructure limits access options'
            ],
            opportunities: [
                'Proximity to 110kV Isosannan substation (1.03 km)',
                'Direct river access for cooling water intake/discharge',
                'Industrial zoning allows datacenter development',
                'Existing heavy industry provides construction expertise',
                'Rail and port access for equipment delivery',
                'Potential for waste heat utilization in nearby facilities'
            ]
        };
    }
    getReferencePoints() {
        return {
            'Talent Center': {
                coords: [61.494451, 21.8128998],
                description: 'Confirmed address at Konepajanranta 4'
            },
            'Isosannan Substation': {
                coords: [61.4886, 21.8052],
                description: '110kV substation, 1.03 km distance, 120 MVA capacity'
            },
            'Herralahden Substation': {
                coords: [61.4922, 21.8105],
                description: '80 MVA capacity, 1.29 km distance'
            },
            'Pori Port': {
                coords: [61.485, 21.795],
                description: 'Port facilities for equipment delivery'
            },
            'Kokemäenjoki River': {
                coords: [61.486, 21.805],
                description: 'Cooling water source, ~300 m³/s flow rate'
            }
        };
    }
}
//# sourceMappingURL=location-guesser.js.map