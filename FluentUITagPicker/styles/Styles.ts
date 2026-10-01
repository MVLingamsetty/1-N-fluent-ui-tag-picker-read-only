import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({

  tagPickerContainer: {
    position: 'relative',
    paddingTop: '3px',
    minWidth: '200px',
    //maxWidth: '400px',  // todo parametrize ??
  },
  refreshButtonRow: {
    position: 'absolute',
    top: '-36px',
    right: '0',
    zIndex: 1,
  },
  readOnlyGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px',
  },
  readOnlyTag: {
    maxWidth: '100%',
    overflowWrap: 'anywhere',
  },
});