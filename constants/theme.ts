// TODO: swap to handwriting font when chosen
import { Platform } from 'react-native';

export const Colors = {
  cream: '#F4F1E8',
  paper: '#F4F1E8', // same tone as cream — used for screens styled like a page (e.g. game summary header)
  ink: '#2B2B28',
  green: '#3D5C45',
  grey: '#8C8C86',
  gold: '#B8902E',
};

export const Font = Platform.select({
  ios: { fontFamily: undefined }, // system font
  android: { fontFamily: undefined },
  default: { fontFamily: undefined },
});
