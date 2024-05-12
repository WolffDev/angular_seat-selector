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

  private seatWidth: number = 30; // default seat width
  private seatHeight: number = 30; // default seat height
  private rowSpacing: number = 40; // default vertical spacing between rows
  private walkwaySpacing: number = 20; // additional space after every two rows
  private verticalPadding: number = 80; // padding from the top and bottom

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
    let additionalY = 0;
    this.rows.forEach((row, index) => {
      let yPosition = index * this.rowSpacing + additionalY;

      // Correctly applying walkway space after every two rows
      if (index > 0 && index % 2 === 1) {
        // Apply after every second row
        additionalY += this.walkwaySpacing;
      }

      for (let i = 1; i <= this.maxNumberOfSeats; i++) {
        const seatId = `${row}${i}`;
        let seatStatus = 'available';
        if (this.occupiedSeats.has(seatId)) {
          seatStatus = 'occupied';
        } else if (this.reservedSeats.has(seatId)) {
          seatStatus = 'reserved';
        }

        // Determine the X coordinate with an added gap after the 10th seat
        let xPosition = (i - 1) * this.seatWidth;
        if (i > 10) {
          xPosition += this.verticalPadding; // Adding an 80 pixel gap after the 10th seat
        }

        this.seats.push({
          id: seatId,
          x: xPosition,
          y: yPosition,
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

    this.seats.forEach((seat) => {
      const gradient = this.ctx.createLinearGradient(
        seat.x,
        seat.y,
        seat.x,
        seat.y + this.seatHeight
      );
      if (this.selectedSeats.has(seat.id)) {
        gradient.addColorStop(0, 'orange');
        gradient.addColorStop(1, 'yellow');
      } else if (seat.status === 'occupied') {
        gradient.addColorStop(0, 'darkred');
        gradient.addColorStop(1, 'red');
      } else if (seat.status === 'reserved') {
        gradient.addColorStop(0, 'darkgrey');
        gradient.addColorStop(1, 'grey');
      } else {
        gradient.addColorStop(0, 'darkgreen');
        gradient.addColorStop(1, 'green');
      }

      // Draw the seat with a rounded rectangle
      this.roundRect(
        this.ctx,
        seat.x,
        seat.y,
        this.seatWidth,
        this.seatHeight,
        5,
        true,
        true,
        gradient
      );

      // Draw seat label
      this.ctx.fillStyle = 'white';
      this.ctx.fillText(seat.id, seat.x + 5, seat.y + this.seatHeight - 10);
    });

    this.ctx.restore();
  }

  roundRect(
    ctx: any,
    x: any,
    y: any,
    width: any,
    height: any,
    radius: any,
    fill: any,
    stroke: any,
    fillStyle: any
  ) {
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
      for (let side in radius) {
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
        x < seat.x + this.seatWidth &&
        y > seat.y &&
        y < seat.y + this.seatHeight &&
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
    const zoomFactor = 0.02;
    const newScale = this.scale + (event.deltaY > 0 ? -zoomFactor : zoomFactor);
    this.scale = Math.max(1, Math.min(newScale, 2));
    this.draw();
  }
}
