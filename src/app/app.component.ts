import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeatSelectorComponent } from './components/seat-selector.component';

interface Seat {
  label: string;
  occupied: boolean;
  reserved: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SeatSelectorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {}
