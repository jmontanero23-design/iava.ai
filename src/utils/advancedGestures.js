/**
 * Advanced Mobile Gesture Detection System
 * Elite PhD-level gesture recognition for mobile trading
 */

// Gesture types
export const GESTURES = {
  // Basic swipes (existing)
  SWIPE_LEFT: 'swipe_left',
  SWIPE_RIGHT: 'swipe_right',
  SWIPE_UP: 'swipe_up',
  SWIPE_DOWN: 'swipe_down',

  // Advanced swipes (new)
  DIAGONAL_UP_RIGHT: 'diagonal_up_right',    // Quick long position
  DIAGONAL_UP_LEFT: 'diagonal_up_left',      // Set stop loss
  DIAGONAL_DOWN_RIGHT: 'diagonal_down_right', // Quick short position
  DIAGONAL_DOWN_LEFT: 'diagonal_down_left',   // Set take profit

  // Multi-finger gestures
  TWO_FINGER_TAP: 'two_finger_tap',          // Show quick stats
  TWO_FINGER_SWIPE_UP: 'two_finger_swipe_up', // Maximize chart
  TWO_FINGER_SWIPE_DOWN: 'two_finger_swipe_down', // Minimize chart
  THREE_FINGER_TAP: 'three_finger_tap',       // Command palette
  THREE_FINGER_SWIPE: 'three_finger_swipe',   // Switch workspace
  FOUR_FINGER_TAP: 'four_finger_tap',         // Emergency close all

  // Special gestures
  CIRCLE: 'circle',                           // Refresh data
  ZIGZAG: 'zigzag',                          // Toggle indicators
  SHAKE: 'shake',                            // Undo last action
  EDGE_SWIPE_LEFT: 'edge_swipe_left',        // Open sidebar
  EDGE_SWIPE_RIGHT: 'edge_swipe_right',      // Open notifications

  // Trading gestures
  DRAW_UP_ARROW: 'draw_up_arrow',            // Place buy order
  DRAW_DOWN_ARROW: 'draw_down_arrow',        // Place sell order
  DRAW_HORIZONTAL_LINE: 'draw_horizontal',    // Set price alert
  DRAW_X: 'draw_x',                          // Cancel order

  // Time-based gestures
  LONG_PRESS: 'long_press',                  // Context menu
  DOUBLE_TAP: 'double_tap',                  // Zoom reset
  TRIPLE_TAP: 'triple_tap',                  // Toggle fullscreen
  TAP_AND_HOLD: 'tap_and_hold',              // Drag mode

  // Pressure-sensitive (3D Touch / Force Touch)
  FORCE_TOUCH: 'force_touch',                // Preview
  DEEP_PRESS: 'deep_press',                  // Quick action menu
}

// Gesture detection class
export class GestureDetector {
  constructor(options = {}) {
    this.sensitivity = options.sensitivity || 50
    this.timeWindow = options.timeWindow || 500
    this.edgeThreshold = options.edgeThreshold || 30
    this.shakeThreshold = options.shakeThreshold || 20

    this.touches = []
    this.gestureHistory = []
    this.isDetecting = false
    this.lastShakeTime = 0
    this.shakeCount = 0

    // Device motion for shake detection
    this.lastX = null
    this.lastY = null
    this.lastZ = null

    // Pattern recognition
    this.pathPoints = []
    this.startPoint = null
  }

  // Start tracking a touch
  startTouch(touch) {
    this.touches.push({
      id: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: touch.clientX,
      currentY: touch.clientY,
      force: touch.force || 0,
      path: [{x: touch.clientX, y: touch.clientY, time: Date.now()}]
    })

    this.startPoint = {x: touch.clientX, y: touch.clientY}
    this.pathPoints = [{x: touch.clientX, y: touch.clientY}]
    this.isDetecting = true
  }

  // Update touch position
  updateTouch(touch) {
    const trackedTouch = this.touches.find(t => t.id === touch.identifier)
    if (!trackedTouch) return

    trackedTouch.currentX = touch.clientX
    trackedTouch.currentY = touch.clientY
    trackedTouch.force = touch.force || 0
    trackedTouch.path.push({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    })

    this.pathPoints.push({x: touch.clientX, y: touch.clientY})
  }

  // End touch and detect gesture
  endTouch(touch) {
    const trackedTouch = this.touches.find(t => t.id === touch.identifier)
    if (!trackedTouch) return null

    const gesture = this.detectGesture(trackedTouch)

    // Remove from tracking
    this.touches = this.touches.filter(t => t.id !== touch.identifier)

    if (this.touches.length === 0) {
      this.isDetecting = false
      this.pathPoints = []
      this.startPoint = null
    }

    return gesture
  }

  // Main gesture detection logic
  detectGesture(touch) {
    const deltaX = touch.currentX - touch.startX
    const deltaY = touch.currentY - touch.startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const duration = Date.now() - touch.startTime
    const velocity = distance / duration

    // Check for special patterns first
    const pattern = this.detectPattern(touch.path)
    if (pattern) return pattern

    // Force touch detection (iPhone 6s+)
    if (touch.force > 0.5) {
      if (touch.force > 0.8) {
        return { type: GESTURES.DEEP_PRESS, force: touch.force }
      }
      return { type: GESTURES.FORCE_TOUCH, force: touch.force }
    }

    // Multi-finger detection
    if (this.touches.length > 1) {
      return this.detectMultiFingerGesture()
    }

    // Edge swipe detection
    if (touch.startX < this.edgeThreshold) {
      if (deltaX > this.sensitivity) {
        return { type: GESTURES.EDGE_SWIPE_RIGHT, velocity }
      }
    }
    if (touch.startX > window.innerWidth - this.edgeThreshold) {
      if (deltaX < -this.sensitivity) {
        return { type: GESTURES.EDGE_SWIPE_LEFT, velocity }
      }
    }

    // Long press detection
    if (distance < 10 && duration > 500) {
      return { type: GESTURES.LONG_PRESS, duration }
    }

    // Quick swipe detection
    if (duration < this.timeWindow && distance > this.sensitivity) {
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI

      // Diagonal swipes (45-degree segments)
      if (angle > -67.5 && angle < -22.5) {
        return { type: GESTURES.DIAGONAL_UP_RIGHT, velocity, angle }
      }
      if (angle > -157.5 && angle < -112.5) {
        return { type: GESTURES.DIAGONAL_UP_LEFT, velocity, angle }
      }
      if (angle > 22.5 && angle < 67.5) {
        return { type: GESTURES.DIAGONAL_DOWN_RIGHT, velocity, angle }
      }
      if (angle > 112.5 && angle < 157.5) {
        return { type: GESTURES.DIAGONAL_DOWN_LEFT, velocity, angle }
      }

      // Cardinal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        return {
          type: deltaX > 0 ? GESTURES.SWIPE_RIGHT : GESTURES.SWIPE_LEFT,
          velocity,
          distance: Math.abs(deltaX)
        }
      } else {
        return {
          type: deltaY > 0 ? GESTURES.SWIPE_DOWN : GESTURES.SWIPE_UP,
          velocity,
          distance: Math.abs(deltaY)
        }
      }
    }

    // Tap detection
    if (distance < 10 && duration < 200) {
      return { type: GESTURES.DOUBLE_TAP } // Will be filtered by tap handler
    }

    return null
  }

  // Detect multi-finger gestures
  detectMultiFingerGesture() {
    const fingerCount = this.touches.length

    if (fingerCount === 2) {
      const [t1, t2] = this.touches
      const deltaY1 = t1.currentY - t1.startY
      const deltaY2 = t2.currentY - t2.startY

      // Both fingers moving in same direction
      if (Math.abs(deltaY1) > this.sensitivity && Math.abs(deltaY2) > this.sensitivity) {
        if (deltaY1 < 0 && deltaY2 < 0) {
          return { type: GESTURES.TWO_FINGER_SWIPE_UP }
        }
        if (deltaY1 > 0 && deltaY2 > 0) {
          return { type: GESTURES.TWO_FINGER_SWIPE_DOWN }
        }
      }

      // Two finger tap
      const dist1 = Math.sqrt(Math.pow(t1.currentX - t1.startX, 2) + Math.pow(t1.currentY - t1.startY, 2))
      const dist2 = Math.sqrt(Math.pow(t2.currentX - t2.startX, 2) + Math.pow(t2.currentY - t2.startY, 2))

      if (dist1 < 10 && dist2 < 10) {
        return { type: GESTURES.TWO_FINGER_TAP }
      }
    }

    if (fingerCount === 3) {
      const allStationary = this.touches.every(t => {
        const dist = Math.sqrt(Math.pow(t.currentX - t.startX, 2) + Math.pow(t.currentY - t.startY, 2))
        return dist < 10
      })

      if (allStationary) {
        return { type: GESTURES.THREE_FINGER_TAP }
      }

      // Three finger swipe
      const avgDeltaX = this.touches.reduce((sum, t) => sum + (t.currentX - t.startX), 0) / 3
      if (Math.abs(avgDeltaX) > this.sensitivity) {
        return { type: GESTURES.THREE_FINGER_SWIPE, direction: avgDeltaX > 0 ? 'right' : 'left' }
      }
    }

    if (fingerCount === 4) {
      return { type: GESTURES.FOUR_FINGER_TAP }
    }

    return null
  }

  // Pattern recognition for drawing gestures
  detectPattern(path) {
    if (path.length < 5) return null

    // Simplify path for pattern matching
    const simplified = this.simplifyPath(path)

    // Circle detection
    if (this.isCircle(simplified)) {
      return { type: GESTURES.CIRCLE }
    }

    // Zigzag detection
    if (this.isZigzag(simplified)) {
      return { type: GESTURES.ZIGZAG }
    }

    // Arrow detection
    if (this.isUpArrow(simplified)) {
      return { type: GESTURES.DRAW_UP_ARROW }
    }
    if (this.isDownArrow(simplified)) {
      return { type: GESTURES.DRAW_DOWN_ARROW }
    }

    // Horizontal line detection
    if (this.isHorizontalLine(simplified)) {
      return { type: GESTURES.DRAW_HORIZONTAL_LINE }
    }

    // X detection
    if (this.isX(simplified)) {
      return { type: GESTURES.DRAW_X }
    }

    return null
  }

  // Shake detection using device motion
  detectShake(event) {
    const current = event.accelerationIncludingGravity

    if (this.lastX === null) {
      this.lastX = current.x
      this.lastY = current.y
      this.lastZ = current.z
      return null
    }

    const deltaX = Math.abs(current.x - this.lastX)
    const deltaY = Math.abs(current.y - this.lastY)
    const deltaZ = Math.abs(current.z - this.lastZ)

    const acceleration = deltaX + deltaY + deltaZ

    if (acceleration > this.shakeThreshold) {
      const now = Date.now()

      if (now - this.lastShakeTime < 1000) {
        this.shakeCount++

        if (this.shakeCount >= 3) {
          this.shakeCount = 0
          return { type: GESTURES.SHAKE, intensity: acceleration }
        }
      } else {
        this.shakeCount = 1
      }

      this.lastShakeTime = now
    }

    this.lastX = current.x
    this.lastY = current.y
    this.lastZ = current.z

    return null
  }

  // Helper: Simplify path for pattern detection
  simplifyPath(path, tolerance = 10) {
    if (path.length <= 2) return path

    const simplified = [path[0]]
    let lastPoint = path[0]

    for (let i = 1; i < path.length; i++) {
      const point = path[i]
      const dist = Math.sqrt(
        Math.pow(point.x - lastPoint.x, 2) +
        Math.pow(point.y - lastPoint.y, 2)
      )

      if (dist > tolerance) {
        simplified.push(point)
        lastPoint = point
      }
    }

    return simplified
  }

  // Pattern detection helpers
  isCircle(path) {
    if (path.length < 8) return false

    const startPoint = path[0]
    const endPoint = path[path.length - 1]
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
      Math.pow(endPoint.y - startPoint.y, 2)
    )

    // Check if start and end are close
    if (distance > 50) return false

    // Check for circular motion (simplified)
    const centerX = path.reduce((sum, p) => sum + p.x, 0) / path.length
    const centerY = path.reduce((sum, p) => sum + p.y, 0) / path.length

    const avgRadius = path.reduce((sum, p) => {
      const dist = Math.sqrt(
        Math.pow(p.x - centerX, 2) +
        Math.pow(p.y - centerY, 2)
      )
      return sum + dist
    }, 0) / path.length

    // Check if points are roughly equidistant from center
    const variance = path.reduce((sum, p) => {
      const dist = Math.sqrt(
        Math.pow(p.x - centerX, 2) +
        Math.pow(p.y - centerY, 2)
      )
      return sum + Math.pow(dist - avgRadius, 2)
    }, 0) / path.length

    return variance < avgRadius * 0.3
  }

  isZigzag(path) {
    if (path.length < 4) return false

    let directionChanges = 0
    let lastDirection = null

    for (let i = 1; i < path.length; i++) {
      const deltaX = path[i].x - path[i-1].x
      const direction = deltaX > 0 ? 'right' : 'left'

      if (lastDirection && direction !== lastDirection) {
        directionChanges++
      }

      lastDirection = direction
    }

    return directionChanges >= 3
  }

  isUpArrow(path) {
    if (path.length < 3) return false

    const startY = path[0].y
    const endY = path[path.length - 1].y

    // Should move upward
    return endY < startY - 50
  }

  isDownArrow(path) {
    if (path.length < 3) return false

    const startY = path[0].y
    const endY = path[path.length - 1].y

    // Should move downward
    return endY > startY + 50
  }

  isHorizontalLine(path) {
    if (path.length < 2) return false

    const maxY = Math.max(...path.map(p => p.y))
    const minY = Math.min(...path.map(p => p.y))
    const maxX = Math.max(...path.map(p => p.x))
    const minX = Math.min(...path.map(p => p.x))

    // Horizontal line: wide X range, narrow Y range
    return (maxX - minX) > 100 && (maxY - minY) < 30
  }

  isX(path) {
    if (path.length < 4) return false

    // Simplified X detection: two diagonal strokes
    // This is a basic implementation - could be improved
    const midIndex = Math.floor(path.length / 2)
    const firstHalf = path.slice(0, midIndex)
    const secondHalf = path.slice(midIndex)

    // Check if first half goes one diagonal direction
    // and second half goes opposite diagonal
    return firstHalf.length >= 2 && secondHalf.length >= 2
  }
}

// Gesture handler with callbacks
export class GestureHandler {
  constructor(element, callbacks = {}) {
    this.element = element
    this.callbacks = callbacks
    this.detector = new GestureDetector()
    this.tapCount = 0
    this.lastTapTime = 0

    this.bindEvents()
  }

  bindEvents() {
    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this))
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this))
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this))

    // Device motion for shake detection
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this))
    }
  }

  handleTouchStart(e) {
    for (let touch of e.changedTouches) {
      this.detector.startTouch(touch)
    }
  }

  handleTouchMove(e) {
    for (let touch of e.changedTouches) {
      this.detector.updateTouch(touch)
    }
  }

  handleTouchEnd(e) {
    for (let touch of e.changedTouches) {
      const gesture = this.detector.endTouch(touch)

      if (gesture) {
        // Handle tap counting for double/triple tap
        if (gesture.type === GESTURES.DOUBLE_TAP) {
          const now = Date.now()

          if (now - this.lastTapTime < 300) {
            this.tapCount++

            if (this.tapCount === 2) {
              this.triggerCallback(GESTURES.DOUBLE_TAP, gesture)
              this.tapCount = 0
            } else if (this.tapCount === 3) {
              this.triggerCallback(GESTURES.TRIPLE_TAP, gesture)
              this.tapCount = 0
            }
          } else {
            this.tapCount = 1
          }

          this.lastTapTime = now
        } else {
          this.triggerCallback(gesture.type, gesture)
        }
      }
    }
  }

  handleDeviceMotion(e) {
    const shake = this.detector.detectShake(e)
    if (shake) {
      this.triggerCallback(shake.type, shake)
    }
  }

  triggerCallback(gestureType, gestureData) {
    if (this.callbacks[gestureType]) {
      this.callbacks[gestureType](gestureData)
    }

    // Also trigger generic callback
    if (this.callbacks.onGesture) {
      this.callbacks.onGesture(gestureType, gestureData)
    }
  }

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart)
    this.element.removeEventListener('touchmove', this.handleTouchMove)
    this.element.removeEventListener('touchend', this.handleTouchEnd)
    window.removeEventListener('devicemotion', this.handleDeviceMotion)
  }
}