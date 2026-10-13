import { Component, input, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-logo',
  imports: [],
  templateUrl: './logo.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './logo.component.css'
})
export class LogoComponent {
  height = input('42px');
  color = input('#FFF');
}
