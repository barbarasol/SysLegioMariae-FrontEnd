import { Component } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { PlatformOwnerMenu } from '../platform-owner-menu/platform-owner-menu';
import { VersaoAtual } from '../versao-atual/versao-atual';

@Component({
  imports: [
    Sidebar,
    RouterOutlet,

  ],
  selector: 'app-layout',
  styleUrl: './layout.scss',
  templateUrl: './layout.html',
})
export class Layout {}
