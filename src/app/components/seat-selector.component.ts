import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-seat-selector',
  templateUrl: './seat-selector.component.html',
  styleUrls: [],
  standalone: true,
})
export class SeatSelectorComponent implements AfterViewInit {
  @ViewChild('seatCanvas') seatCanvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private seats: any[] = [];
  private scale: number = 1.0;
  private originX: number = 0;
  private originY: number = 0;
  private dragging: boolean = false;
  private lastX!: number;
  private lastY!: number;
  private selectedSeats: Set<string> = new Set();
  private maxSelections = 5;
  private maxNumberOfSeats = 20;
  private rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  private occupiedSeats = new Set(['a1', 'a2', 'b10', 'c5', 'd15']); // Example occupied seats
  private reservedSeats = new Set(['a3', 'b1', 'b2', 'f20', 'j10']); // Example reserved seats

  ngAfterViewInit(): void {
    this.ctx = this.seatCanvas.nativeElement.getContext(
      '2d'
    ) as CanvasRenderingContext2D;
    this.initSeats();
    this.draw();
  }

  initSeats() {
    this.rows.forEach((row, index) => {
      for (let i = 1; i <= this.maxNumberOfSeats; i++) {
        const seatId = `${row}${i}`;
        let seatStatus = 'available';
        if (this.occupiedSeats.has(seatId)) {
          seatStatus = 'occupied';
        } else if (this.reservedSeats.has(seatId)) {
          seatStatus = 'reserved';
        }
        this.seats.push({
          id: seatId,
          x: i <= 10 ? i * 40 : (i - 10) * 40 + 420,
          y: index * 40,
          status: seatStatus,
        });
      }
    });
  }

  draw() {
    this.ctx.clearRect(
      0,
      0,
      this.seatCanvas.nativeElement.width,
      this.seatCanvas.nativeElement.height
    );
    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(this.originX, this.originY);

    // Loop through each seat to apply styles and draw
    this.seats.forEach((seat) => {
      // Set up gradients for seat fill
      const gradient = this.ctx.createLinearGradient(
        seat.x,
        seat.y,
        seat.x,
        seat.y + 30
      );
      if (this.selectedSeats.has(seat.id)) {
        gradient.addColorStop(0, 'orange');
        gradient.addColorStop(1, 'yellow');
      } else if (seat.status === 'occupied') {
        gradient.addColorStop(0, 'darkred');
        gradient.addColorStop(1, 'red');
      } else if (seat.status === 'reserved') {
        gradient.addColorStop(0, 'darkblue');
        gradient.addColorStop(1, 'blue');
      } else {
        gradient.addColorStop(0, 'darkgreen');
        gradient.addColorStop(1, 'green');
      }

      // Draw the seat with a rounded rectangle
      this.roundRect(this.ctx, seat.x, seat.y, 30, 30, 5, true, true, gradient);

      // Draw seat label
      this.ctx.fillStyle = 'black';
      this.ctx.fillText(seat.id, seat.x + 5, seat.y + 20);
    });

    this.ctx.restore();
  }

  // Helper function to draw rounded rectangles
  roundRect(
    _ctx: any,
    _x: any,
    _y: any,
    _width: any,
    _height: any,
    _radius: any,
    _fill: any,
    _stroke: any,
    _fillStyle: any
  ) {
    let ctx = _ctx;
    let x = _x;
    let y = _y;
    let width = _width;
    let height = _height;
    let radius = _radius;
    let fill = _fill;
    let stroke = _stroke;
    let fillStyle = _fillStyle;
    if (typeof stroke === 'undefined') {
      stroke = true;
    }
    if (typeof radius === 'undefined') {
      radius = 5;
    }
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
      for (let side in defaultRadius) {
        // @ts-ignore
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius.br,
      y + height
    );
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }

  onMouseDown(event: MouseEvent) {
    this.dragging = true;
    this.lastX = event.offsetX;
    this.lastY = event.offsetY;

    const rect = this.seatCanvas.nativeElement.getBoundingClientRect();
    const scaleX = this.seatCanvas.nativeElement.width / rect.width;
    const scaleY = this.seatCanvas.nativeElement.height / rect.height;
    const x =
      ((event.clientX - rect.left) * scaleX) / this.scale - this.originX;
    const y = ((event.clientY - rect.top) * scaleY) / this.scale - this.originY;

    this.seats.forEach((seat) => {
      if (
        x > seat.x &&
        x < seat.x + 30 &&
        y > seat.y &&
        y < seat.y + 30 &&
        seat.status === 'available'
      ) {
        if (this.selectedSeats.has(seat.id)) {
          this.selectedSeats.delete(seat.id);
        } else if (this.selectedSeats.size < this.maxSelections) {
          this.selectedSeats.add(seat.id);
        }
        this.draw();
      }
    });
  }

  onMouseMove(event: MouseEvent) {
    if (this.dragging) {
      let deltaX = (event.offsetX - this.lastX) / this.scale;
      let deltaY = (event.offsetY - this.lastY) / this.scale;
      this.originX += deltaX;
      this.originY += deltaY;
      this.lastX = event.offsetX;
      this.lastY = event.offsetY;
      this.draw();
    }
  }

  onMouseUp(event: MouseEvent) {
    this.dragging = false;
  }

  onMouseWheel(event: any) {
    const zoomFactor = 0.02; // Further reduced zoom sensitivity
    const newScale = this.scale + (event.deltaY > 0 ? -zoomFactor : zoomFactor);
    this.scale = Math.max(0.5, Math.min(newScale, 3)); // Constrain the zoom level
    this.draw();
  }
}
