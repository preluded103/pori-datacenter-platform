/**
 * Location Guesser - Generates educated guesses for site boundaries based on research
 */

interface AppConfig {
    siteCenter: [number, number];
    targetArea: number;
    phaseAreas: {
        phase1: { min: number; max: number };
        phase2: number;
    };
}

export class LocationGuesser {
    constructor(private config: AppConfig) {}

    generateInitialBoundary(): [number, number][] | null {
        try {
            // Based on research findings:
            // - Site is at Konepajanranta, industrial waterfront area
            // - Claims to be "next to 110kV grid" 
            // - Target area: 150,000 m² (15 hectares)
            // - Industrial waterfront location suggests rectangular development

            const centerLat = this.config.siteCenter[0];
            const centerLng = this.config.siteCenter[1];
            
            // Calculate approximate dimensions for target area
            // Assuming rectangular site with 2:1 ratio (common for industrial sites)
            const targetAreaM2 = this.config.targetArea;
            const ratio = 2; // length:width ratio
            
            // Calculate width and height in meters
            const width = Math.sqrt(targetAreaM2 / ratio);
            const length = width * ratio;
            
            // Convert meters to degrees (approximation for Finland latitude)
            const metersPerDegreeLat = 111320; // roughly constant
            const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);
            
            const halfWidthDeg = (width / 2) / metersPerDegreeLng;
            const halfLengthDeg = (length / 2) / metersPerDegreeLat;
            
            // Create rectangle aligned with waterfront (slightly rotated)
            // Based on aerial imagery analysis, the waterfront runs roughly E-W
            const rotationAngle = 10 * Math.PI / 180; // 10 degrees to align with waterfront
            
            // Define corners of rectangle before rotation
            const corners = [
                [-halfLengthDeg, -halfWidthDeg], // SW
                [halfLengthDeg, -halfWidthDeg],  // SE
                [halfLengthDeg, halfWidthDeg],   // NE
                [-halfLengthDeg, halfWidthDeg]   // NW
            ];
            
            // Apply rotation and translate to center
            const rotatedCorners: [number, number][] = corners.map(([x, y]) => {
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
            
        } catch (error) {
            console.error('Error generating initial boundary:', error);
            return null;
        }
    }

    // Generate alternative boundary suggestions based on different criteria
    generateAlternativeBoundaries(): { [key: string]: [number, number][] } {
        const alternatives: { [key: string]: [number, number][] } = {};
        
        try {
            const centerLat = this.config.siteCenter[0];
            const centerLng = this.config.siteCenter[1];
            
            // Phase I only boundary (smaller, conservative)
            const phase1Area = this.config.phaseAreas.phase1.max;
            const phase1Boundary = this.generateRectangularBoundary(
                centerLat, centerLng, phase1Area, 1.5, 0
            );
            if (phase1Boundary) {
                alternatives['Phase I Only'] = phase1Boundary;
            }
            
            // Square boundary (1:1 ratio)
            const squareBoundary = this.generateRectangularBoundary(
                centerLat, centerLng, this.config.targetArea, 1, 5
            );
            if (squareBoundary) {
                alternatives['Square Layout'] = squareBoundary;
            }
            
            // Narrow waterfront boundary (3:1 ratio)
            const waterfrontBoundary = this.generateRectangularBoundary(
                centerLat, centerLng, this.config.targetArea, 3, 15
            );
            if (waterfrontBoundary) {
                alternatives['Waterfront Linear'] = waterfrontBoundary;
            }
            
            // Optimized for grid access (positioned closer to known substations)
            const gridOptimizedCenter: [number, number] = [
                centerLat + 0.001, // Slightly north toward Isosannan substation
                centerLng - 0.002  // Slightly west toward power infrastructure
            ];
            const gridBoundary = this.generateRectangularBoundary(
                gridOptimizedCenter[0], gridOptimizedCenter[1], 
                this.config.targetArea, 2, 10
            );
            if (gridBoundary) {
                alternatives['Grid Optimized'] = gridBoundary;
            }
            
        } catch (error) {
            console.error('Error generating alternative boundaries:', error);
        }
        
        return alternatives;
    }

    private generateRectangularBoundary(
        centerLat: number, 
        centerLng: number, 
        areaM2: number, 
        ratio: number, 
        rotationDegrees: number
    ): [number, number][] | null {
        try {
            // Calculate dimensions
            const width = Math.sqrt(areaM2 / ratio);
            const length = width * ratio;
            
            // Convert to degrees
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
            
        } catch (error) {
            console.error('Error generating rectangular boundary:', error);
            return null;
        }
    }

    // Analyze site characteristics to refine boundary placement
    analyzeSiteConstraints(): {
        recommendations: string[];
        constraints: string[];
        opportunities: string[];
    } {
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

    // Get reference points for validation
    getReferencePoints(): { [key: string]: { coords: [number, number]; description: string } } {
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