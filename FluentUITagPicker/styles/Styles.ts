import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({

  tagPickerContainer: {
    position: 'relative',
    paddingTop: '3px',
    minWidth: '200px',
    //maxWidth: '400px',  // todo parametrize ??
  },
  readOnlyGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px',
    boxSizing: 'border-box',
    minHeight: '32px',
    padding: '4px',
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  readOnlyTag: {
    maxWidth: '100%',
    overflowWrap: 'anywhere',
  },
});