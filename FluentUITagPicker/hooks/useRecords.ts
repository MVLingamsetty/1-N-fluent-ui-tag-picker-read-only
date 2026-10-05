import { useQuery } from '@tanstack/react-query'

import { usePcfContext } from '../services/PcfContext'
import { useDatasetView } from './useDatasetView'
import { useMetadata } from './useMetadata'




export const useRecords = () => {
  const pcfcontext = usePcfContext()
  const { entityname } = useDatasetView()
  const { primaryid } = useMetadata(entityname)
  const { lookupColumn, nestedLookupColumn, tagColorColumn } = pcfcontext
  const datasetRecordIds = pcfcontext.context.parameters.tagsDataSet.sortedRecordIds ?? []

  const { data, status, error, isFetching } =
    useQuery<ComponentFramework.WebApi.Entity[], Error>(
      {
        queryKey: ['datasetviewrecords', pcfcontext.instanceid, pcfcontext.viewid, lookupColumn, nestedLookupColumn, tagColorColumn, datasetRecordIds],
        queryFn: () => pcfcontext.getDatsetViewRecords(entityname, primaryid, lookupColumn, nestedLookupColumn, tagColorColumn, datasetRecordIds),
        enabled: !!entityname && !!primaryid && !!lookupColumn && !!nestedLookupColumn && datasetRecordIds.length > 0,
        staleTime: Infinity
      }
    )

  return { records: data, primaryid, hasDatasetRecords: datasetRecordIds.length > 0, status,
    error,
    isFetching }
}


export interface IRecord {
  id: string;
  primaryname?: string;
  displaytext: string;
  color?: string;
  imagesrc?: string;
}

export const useTagPickerOptions = () => {
  const { records, primaryid, hasDatasetRecords, status, error, isFetching } = useRecords()
  const seenDisplayTexts = new Set<string>()
  const options:IRecord[] = records && primaryid ? records
    .map(record => ({
      id: String(record[primaryid] ?? ''),
      displaytext: String(record.__tagDisplayText ?? ''),
      color: String(record.__tagColor ?? '')
    }))
    .filter(option => {
      const displayText = option.displaytext.trim()
      const normalizedDisplayText = displayText.toLowerCase()
      if (!option.id || !displayText || seenDisplayTexts.has(normalizedDisplayText)) {
        return false
      }

      seenDisplayTexts.add(normalizedDisplayText)
      return true
    }) : []

  return { options, hasDatasetRecords, status, error, isFetching }
}


