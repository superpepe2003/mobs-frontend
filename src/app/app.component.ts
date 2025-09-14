import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment';
import { BossKillService } from './services/boss-kill.service';
import { BossKill } from './models/boss-kill.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Mobs-Frontend';

  // Variables para autenticación
  passwordInput = '';
  isAuthenticated = false;

  // Variables para filtros
  servidorFilter = '';
  monstruoFilter = '';

  // Variables para datos
  bossKills: BossKill[] = [];
  filteredBossKills: BossKill[] = [];
  loading = false;
  error = '';

  // Variables para el countdown
  private countdownInterval: any;
  private refreshInterval: any;
  displayTimes: { [key: string]: string } = {};

  constructor(private bossKillService: BossKillService) {}

  ngOnInit() {
    // No cargar datos hasta que se autentique
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  authenticate() {
    if (this.passwordInput === environment.secret_pass) {
      this.isAuthenticated = true;
      this.loadBossKills();
    } else {
      this.error = 'Clave incorrecta';
    }
  }
  loadBossKills() {
    this.loading = true;
    this.error = '';

    this.bossKillService.getBossKills().subscribe({
      next: (response) => {
        this.bossKills = response.results;
        this.filteredBossKills = response.results;
        this.initializeCountdown();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos: ' + err.message;
        this.loading = false;
      }
    });
  }

  initializeCountdown() {
    // Inicializar los tiempos de display
    this.bossKills.forEach(kill => {
      const key = `${kill.servidor}-${kill.monstruo}-${kill.fecha_iso}`;
      this.displayTimes[key] = kill.time_until_respawn;
    });

    // Limpiar intervalos existentes
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Iniciar countdown cada segundo
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);

    // Refrescar datos desde el backend cada 5 minutos
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 5 * 60 * 1000);
  }

  updateCountdown() {
    Object.keys(this.displayTimes).forEach(key => {
      const timeStr = this.displayTimes[key];
      if (timeStr) {
        const newTime = this.decrementTime(timeStr);
        this.displayTimes[key] = newTime;
      }
    });
  }

  decrementTime(timeStr: string): string {
    const isNegative = timeStr.startsWith('-');
    let workingTime = isNegative ? timeStr.substring(1) : timeStr;

    const parts = workingTime.split(':');
    if (parts.length !== 3) return timeStr;

    let hours = parseInt(parts[0]) || 0;
    let minutes = parseInt(parts[1]) || 0;
    let seconds = parseInt(parts[2]) || 0;

    if (isNegative) {
      // Para tiempo negativo, sumamos 1 segundo (se hace más negativo)
      seconds++;
      if (seconds > 59) {
        seconds = 0;
        minutes++;
        if (minutes > 59) {
          minutes = 0;
          hours++;
        }
      }
      return `-${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      // Para tiempo positivo, restamos 1 segundo
      seconds--;
      if (seconds < 0) {
        seconds = 59;
        minutes--;
        if (minutes < 0) {
          minutes = 59;
          hours--;
          if (hours < 0) {
            // Cuando llega a 0, se convierte en tiempo negativo
            return '-00:00:01';
          }
        }
      }
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  refreshData() {
    // Actualizar datos sin mostrar loading
    this.bossKillService.getBossKills().subscribe({
      next: (response) => {
        this.bossKills = response.results;
        this.applyFilters(); // Reaplicar filtros

        // Actualizar los tiempos de display con los nuevos datos
        this.bossKills.forEach(kill => {
          const key = `${kill.servidor}-${kill.monstruo}-${kill.fecha_iso}`;
          this.displayTimes[key] = kill.time_until_respawn;
        });
      },
      error: (err) => {
        console.error('Error al actualizar datos:', err);
      }
    });
  }

  getDisplayTime(kill: BossKill): string {
    const key = `${kill.servidor}-${kill.monstruo}-${kill.fecha_iso}`;
    const displayTime = this.displayTimes[key];

    if (!displayTime) {
      return kill.time_until_respawn || '00:00:00';
    }

    return displayTime;
  }

  applyFilters() {
    this.filteredBossKills = this.bossKills.filter(kill => {
      const servidorMatch = !this.servidorFilter ||
        kill.servidor.toLowerCase().includes(this.servidorFilter.toLowerCase());
      const monstruoMatch = !this.monstruoFilter ||
        kill.monstruo.toLowerCase().includes(this.monstruoFilter.toLowerCase());

      return servidorMatch && monstruoMatch;
    });
  }

  clearFilters() {
    this.servidorFilter = '';
    this.monstruoFilter = '';
    this.filteredBossKills = this.bossKills;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'available':
        return 'status-available';
      case 'waiting':
        return 'status-waiting';
      default:
        return '';
    }
  }

  getStatusClassForDisplay(kill: BossKill): string {
    const displayTime = this.getDisplayTime(kill);
    return displayTime.startsWith('-') ? 'status-available' : 'status-waiting';
  }
}
