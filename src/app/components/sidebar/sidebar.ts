import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PlatformOwnerMenu } from '../platform-owner-menu/platform-owner-menu';
import { VersaoAtual } from '../versao-atual/versao-atual';

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    PlatformOwnerMenu,
    VersaoAtual
  ],
  selector: 'app-sidebar',
  styleUrl: './sidebar.scss',
  templateUrl: './sidebar.html',
})
export class Sidebar {}
