import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TrackByFunction,
  ViewChild,
} from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavigationEnd, Router } from '@angular/router';
import { fromEvent } from '@rx-angular/cdk';
import { RxState } from '@rx-angular/state';
import { pipe } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthStateService } from '../auth/auth.state';
import { TmdbAuthEffects } from '../auth/tmdbAuth.effects';
import { StateService } from '../shared/service/state.service';
import { MovieGenreModel } from '../movies/model';

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  // **🚀 Perf Tip:**
  // Use ChangeDetectionStrategy.OnPush in all components to reduce change detection & template re-evaluation
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class AppShellComponent implements OnInit, OnDestroy {
  mobileQuery: MediaQueryList;
  genres$ = this.tmdbState.genres$;
  lang: string;
  // tslint:disable-next-line: variable-name
  private _mobileQueryListener: () => void;
  @ViewChild('snav') snav: any;

  readonly viewState$ = this.state.select();

  constructor(
    private state: RxState<{
      activeRoute: string;
      isMobile: boolean;
    }>,
    public tmdbState: StateService,
    public authState: AuthStateService,
    public authEffects: TmdbAuthEffects,
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private router: Router,
    private snackbar: MatSnackBar
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 1299px)');
    this.state.connect(
      'isMobile',
      fromEvent(this.mobileQuery, 'change').pipe(
        map(() => this.mobileQuery.matches),
        startWith(this.mobileQuery.matches)
      )
    );
    this.state.connect(
      'activeRoute',
      this.router.events.pipe(
        filter<NavigationEnd>((e) => e instanceof NavigationEnd),
        map((e) => e.url)
      )
    );
  }

  ngOnInit() {}

  ngOnDestroy(): void {
    // tslint:disable-next-line: deprecation
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  /*@HostListener('window:scroll', ['$event']) scrollHandler(event) {
    const height = window.scrollY;
    const el = document.getElementById('btn-returnToTop');
    height >= 500 ? (el.className = 'show') : (el.className = 'hide');
  }*/

  searchMovie(term: string) {
    term === ''
      ? this.router.navigate(['/movies/now-playing'])
      : this.router.navigate(['/movies/search', { term }]);
  }

  onSignOut() {
    this.authEffects.signOut();

    this.snackbar.open('Goodbye', '', { duration: 2000 });

    this.router.navigate(['/movies/now-playing']);
  }

  navTo(path: string, args: any) {
    this.closeSidenav();
    this.resetPagination();
    this.router.navigate([path, args]);
  }

  closeSidenav() {
    if (this.mobileQuery.matches !== false) {
      this.snav.close();
    }
  }

  resetPagination() {
    sessionStorage.setItem('hubmovies-current-page', '1');
  }

  trackByGenre: TrackByFunction<MovieGenreModel> = (
    idx: number,
    genre: MovieGenreModel
  ) => genre.name
}