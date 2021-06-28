import RouteType from './Route';
import {
    MapSharp as BuildIcon,
    LanguageSharp as ExploreIcon
} from '@material-ui/icons';
import Build from '../views/Build';
import Explore from "../views/Explore";

export const defaultRoute: RouteType = {
    name: 'Build',
    id: 'build',
    path: '/build',
    component: Build,
    icon: BuildIcon,
    allowSubPaths: true
}

export const publicRoutes: RouteType[] = [
    defaultRoute,
    {
        name: 'Explore',
        id: 'explore',
        path: '/explore',
        component: Explore,
        icon: ExploreIcon,
        allowSubPaths: true
    },
]
