import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  OnInit,
} from '@angular/core';
import { ResponsiveService } from '../services/responsive.service';

@Component({
  selector: 'app-seat-selector',
  templateUrl: './seat-selector.component.html',
  styles: [
    `
      .tooltip {
        position: absolute;
        width: 200px;
        background-color: white;
        border: 1px solid #ccc;
        padding: 8px;
        z-index: 1000;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule],
})
export class SeatSelectorComponent implements OnInit, AfterViewInit {
  @ViewChild('seatCanvas', { static: true })
  public seatCanvas!: ElementRef<HTMLCanvasElement>;
  public canvasWidth: number = window.innerWidth - 400;
  public canvasHeight: number = window.innerHeight - 400;

  public currentTooltip: CurrentTooltip | null = null;
  public tooltipX: number = 0;
  public tooltipY: number = 0;
  public selectedSeats: Map<string, Seat> = new Map();
  public maxSelections = 5;

  private ctx!: CanvasRenderingContext2D;
  private seats: any[] = [];

  private seatWidth: number = 30; // default seat width
  private seatHeight: number = 30; // default seat height
  private rowSpacing: number = 40; // default vertical spacing between rows
  private walkwaySpacing: number = 20; // additional space after every two rows
  private verticalPadding: number = 80; // padding from the top and bottom

  private scale: number = 1.2;
  private originX: number = 60;
  private originY: number = 20;
  private dragging: boolean = false;
  private lastX!: number;
  private lastY!: number;
  private maxNumberOfSeats = 20;
  private rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  private occupiedSeats: Map<string, SeatOccupant> = new Map([
    ['a1', { username: 'user1', name: 'User 1' }],
    ['a2', { username: 'user2', name: 'User 2' }],
    ['b3', { username: 'user3', name: 'User 3' }],
    ['f21', { username: 'user4', name: 'User 4' }],
    ['j11', { username: 'user5', name: 'User 5' }],
  ]);
  // Example occupied seats
  private reservedSeats = new Set(['a3', 'b1', 'b2', 'f20', 'j10', 'a', 'g']); // Example reserved seats

  // For pinch-to-zoom
  private initialDistance: number | null = null;
  private initialScale: number | null = null;

  constructor(private responsiveService: ResponsiveService) {}

  ngOnInit(): void {
    this.responsiveService.isHandset$.subscribe((isHandset) => {
      if (isHandset) {
        this.canvasHeight = window.innerHeight - 150;
        this.canvasWidth = window.innerWidth - 20; // Adjust width if necessary
      }
    });

    this.responsiveService.isTablet$.subscribe((isTablet) => {
      if (isTablet) {
        this.canvasHeight = window.innerHeight - 150;
        this.canvasWidth = window.innerWidth - 20; // Adjust width if necessary
      }
    });
  }

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

        // Check if the whole row is reserved by checking if the row letter is in the Set(), i.e. ['a'] by it self
        if (this.reservedSeats.has(row)) {
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
    this.hideTooltip();
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
        y < seat.y + this.seatHeight
      ) {
        console.log(seat);
        if (seat.status === 'available') {
          if (this.selectedSeats.has(seat.id)) {
            this.selectedSeats.delete(seat.id);
          } else if (this.selectedSeats.size < this.maxSelections) {
            this.selectedSeats.set(seat.id, seat);
          }
        }
        if (seat.status === 'occupied') {
          this.showTooltip(seat);
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

  onMouseLeave() {
    if (this.dragging) {
      this.dragging = false;
      this.resetCanvasPosition();
      this.draw();
    }
  }

  onTouchStart(event: TouchEvent) {
    event.preventDefault();

    if (event.touches.length === 2) {
      this.initialDistance = this.getDistance(
        event.touches[0],
        event.touches[1]
      );
      this.initialScale = this.scale;
    } else if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.onMouseDown(this.touchToMouseEvent(touch));
    }
  }

  onTouchMove(event: TouchEvent) {
    event.preventDefault();

    if (event.touches.length === 2) {
      const newDistance = this.getDistance(event.touches[0], event.touches[1]);
      const scaleChange = newDistance / (this.initialDistance as number);
      this.scale = (this.initialScale as number) * scaleChange;
      this.scale = Math.max(1, Math.min(this.scale, 2));
      this.draw();
    } else if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.onMouseMove(this.touchToMouseEvent(touch));
    }
  }

  onTouchEnd(event: TouchEvent) {
    event.preventDefault();

    if (event.touches.length === 0) {
      this.initialDistance = null;
      this.initialScale = null;
      this.onMouseUp(this.touchToMouseEvent(event.changedTouches[0]));
    }
  }

  onTouchCancel(event: TouchEvent) {
    event.preventDefault();
    if (event.touches.length === 0) {
      this.initialDistance = null;
      this.initialScale = null;
      this.onMouseLeave();
    }
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private touchToMouseEvent(touch: Touch): MouseEvent {
    const rect = this.seatCanvas.nativeElement.getBoundingClientRect();
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
      button: 0, // Left button
      preventDefault: () => {},
      stopPropagation: () => {},
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      bubbles: false,
      cancelable: false,
      // Include any other necessary properties here
    } as MouseEvent;
  }

  resetCanvasPosition() {
    this.hideTooltip();
    this.scale = 1.2;
    this.originX = 60;
    this.originY = 20;
  }

  @HostListener('wheel', ['$event'])
  onMouseWheel(event: any) {
    event.preventDefault();
    const zoomFactor = 0.02;
    const newScale = this.scale + (event.deltaY > 0 ? -zoomFactor : zoomFactor);
    this.scale = Math.max(1, Math.min(newScale, 2));
    this.draw();
  }

  showTooltip(seat: any) {
    const occupant = this.occupiedSeats.get(seat.id) as SeatOccupant;
    console.log(occupant);
    this.currentTooltip = {
      seat: seat.id,
      username: occupant.username,
      name: occupant.name,
    };

    const canvasRect = this.seatCanvas.nativeElement.getBoundingClientRect();
    // Calculate the tooltip coordinates, making sure to apply both translation and scaling
    this.tooltipX = (seat.x + this.originX) * this.scale + canvasRect.left;
    this.tooltipY =
      (seat.y + this.seatHeight + this.originY) * this.scale + canvasRect.top;

    // Adjust the tooltip position slightly away from the seat for better visibility
    this.tooltipX += 20; // 20px offset for x coordinate
    this.tooltipY += 20; // 20px offset for y coordinate
  }

  hideTooltip() {
    this.currentTooltip = null;
  }
}

interface SeatOccupant {
  username: string;
  name: string;
}

interface CurrentTooltip {
  seat: string;
  username: string;
  name: string;
}

interface Seat {
  id: string;
  x: number;
  y: number;
  status: string;
}
