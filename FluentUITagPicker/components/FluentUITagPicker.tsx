import * as React from 'react'
import { Spinner, Tag } from '@fluentui/react-components'
import { useTagPickerOptions } from '../hooks/useRecords'
import { usePcfContext } from '../services/PcfContext'
import { useStyles } from '../styles/Styles'

const FluentUITagPicker = (): React.JSX.Element => {
    const pcfcontext = usePcfContext()
    const { options, hasDatasetRecords, status } = useTagPickerOptions()
    const styles = useStyles()

    if (!pcfcontext.lookupColumn.trim() || !pcfcontext.nestedLookupColumn.trim()) {
        return <div>{pcfcontext.context.resources.getString('Configure both lookup columns.') || 'Configure both lookup columns.'}</div>
    }

    return (
        <div className={styles.tagPickerContainer}>
            {status === 'pending' && hasDatasetRecords
                ? <Spinner size="tiny" appearance="primary" label={pcfcontext.context.resources.getString('Loading...') || 'Loading...'} />
                : status === 'error'
                    ? <div>{pcfcontext.context.resources.getString('Error fetching data...') || 'Error fetching data...'}</div>
                    : <div className={styles.readOnlyGrid} role="list">
                        {options.map(option => (
                            <Tag
                                key={option.id}
                                className={styles.readOnlyTag}
                                shape="rounded"
                                size="medium"
                                appearance="brand"
                                role="listitem"
                                style={option.color && CSS.supports('color', option.color) ? { backgroundColor: option.color } : undefined}
                            >
                                {option.displaytext}
                            </Tag>
                        ))}
                    </div>}
        </div>
    )
}

export default FluentUITagPicker