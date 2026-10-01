import { IInputs } from '../generated/ManifestTypes'

//https://www.inogic.com/blog/2020/12/get-subgrid-information-from-the-pcf-context/

export interface IPcfContextServiceProps{
  context: ComponentFramework.Context<IInputs>
  instanceid: string
  isDarkMode: boolean
}

export interface iTagInfo{
  id: string
  name: string
}

export class PcfContextService {
  instanceid:string
  context: ComponentFramework.Context<IInputs>
  viewid : string
  lookupColumn:string
  nestedLookupColumn:string
  
  

  constructor (props?:IPcfContextServiceProps) {
    if (props) {
      this.instanceid = props.instanceid
      this.context = props.context
      this.viewid = (this.context as any).navigation._customControlProperties.descriptor.Parameters.ViewId
      this.lookupColumn = props.context.parameters.lookupColumn.raw?.trim() ?? ''
      this.nestedLookupColumn = props.context.parameters.nestedLookupColumn.raw?.trim() ?? ''
    }
  }

  async getEntityMetadata (entityname:string) : Promise<ComponentFramework.PropertyHelper.EntityMetadata> {
    return this.context.utils.getEntityMetadata(entityname)
  }

  refreshDataset (): void {
    this.context.parameters.tagsDataSet.refresh()
  }

  async getDatasetView () : Promise<ComponentFramework.WebApi.Entity> {
    return await this.context.webAPI
      .retrieveRecord('savedquery', this.viewid, '?$select=returnedtypecode')
  }


  async getDatsetViewRecords (entityname:string, primaryid:string, lookupColumn:string, nestedLookupColumn:string, sourceRecordIds:string[]) : Promise<ComponentFramework.WebApi.Entity[]> {
    const logicalNamePattern = /^[a-z][a-z0-9_]*$/i
    if (!logicalNamePattern.test(entityname) || !logicalNamePattern.test(primaryid) || !logicalNamePattern.test(lookupColumn) || !logicalNamePattern.test(nestedLookupColumn)) {
      throw new Error('Lookup columns must be valid logical names.')
    }

    const parser = new DOMParser()
    const normalizeId = (id:string):string => id.replace(/[{}]/g, '').toLowerCase()
    const relatedRecordIds = Array.from(new Set(sourceRecordIds.map(normalizeId)))
    if (relatedRecordIds.length === 0) {
      return []
    }

    const sourceFetchXml = parser.parseFromString('<fetch><entity /></fetch>', 'text/xml')
    const sourceEntity = sourceFetchXml.getElementsByTagName('entity')[0]
    sourceEntity.setAttribute('name', entityname)

    for (const attribute of [primaryid, lookupColumn]) {
      const attributeElement = sourceFetchXml.createElement('attribute')
      attributeElement.setAttribute('name', attribute)
      sourceEntity.appendChild(attributeElement)
    }

    const sourceFilter = sourceFetchXml.createElement('filter')
    const sourceCondition = sourceFetchXml.createElement('condition')
    sourceCondition.setAttribute('attribute', primaryid)
    sourceCondition.setAttribute('operator', 'in')
    relatedRecordIds.forEach(id => {
      const value = sourceFetchXml.createElement('value')
      value.textContent = id
      sourceCondition.appendChild(value)
    })
    sourceFilter.appendChild(sourceCondition)
    sourceEntity.appendChild(sourceFilter)

    const sourceFetchXmlString = new XMLSerializer().serializeToString(sourceFetchXml)
    const result = await this.context.webAPI.retrieveMultipleRecords(entityname, `?fetchXml=${encodeURIComponent(sourceFetchXmlString)}`)
    const lookupIdsByEntity = new Map<string, Set<string>>()

    result.entities.forEach(record => {
      const lookupId = String(record[`_${lookupColumn}_value`] ?? '')
      const lookupEntityName = String(record[`_${lookupColumn}_value@Microsoft.Dynamics.CRM.lookuplogicalname`] ?? '')
      if (!lookupId || !lookupEntityName) {
        return
      }

      const lookupIds = lookupIdsByEntity.get(lookupEntityName) ?? new Set<string>()
      lookupIds.add(normalizeId(lookupId))
      lookupIdsByEntity.set(lookupEntityName, lookupIds)
    })

    const displayTextByLookup = new Map<string, string>()
    await Promise.all(Array.from(lookupIdsByEntity, async ([lookupEntityName, lookupIds]) => {
      const lookupMetadata = await this.context.utils.getEntityMetadata(lookupEntityName)
      const lookupPrimaryId = lookupMetadata.PrimaryIdAttribute
      if (!lookupPrimaryId) {
        return
      }

      const ids = Array.from(lookupIds)
      for (let offset = 0; offset < ids.length; offset += 500) {
        const targetFetchXml = parser.parseFromString('<fetch><entity /></fetch>', 'text/xml')
        const targetEntity = targetFetchXml.getElementsByTagName('entity')[0]
        targetEntity.setAttribute('name', lookupEntityName)

        for (const attribute of [lookupPrimaryId, nestedLookupColumn]) {
          const attributeElement = targetFetchXml.createElement('attribute')
          attributeElement.setAttribute('name', attribute)
          targetEntity.appendChild(attributeElement)
        }

        const filter = targetFetchXml.createElement('filter')
        const condition = targetFetchXml.createElement('condition')
        condition.setAttribute('attribute', lookupPrimaryId)
        condition.setAttribute('operator', 'in')
        ids.slice(offset, offset + 500).forEach(id => {
          const value = targetFetchXml.createElement('value')
          value.textContent = id
          condition.appendChild(value)
        })
        filter.appendChild(condition)
        targetEntity.appendChild(filter)

        const targetFetchXmlString = new XMLSerializer().serializeToString(targetFetchXml)
        const lookupRecords = await this.context.webAPI.retrieveMultipleRecords(
          lookupEntityName,
          `?fetchXml=${encodeURIComponent(targetFetchXmlString)}`
        )

        lookupRecords.entities.forEach(record => {
          const lookupId = normalizeId(String(record[lookupPrimaryId] ?? ''))
          const displayText = String(record[`_${nestedLookupColumn}_value@OData.Community.Display.V1.FormattedValue`] ?? '')
          displayTextByLookup.set(`${lookupEntityName}:${lookupId}`, displayText)
        })
      }
    }))

    return result.entities.map(record => {
      const lookupId = String(record[`_${lookupColumn}_value`] ?? '')
      const lookupEntityName = String(record[`_${lookupColumn}_value@Microsoft.Dynamics.CRM.lookuplogicalname`] ?? '')
      const displayText = lookupEntityName && lookupId
        ? displayTextByLookup.get(`${lookupEntityName}:${normalizeId(lookupId)}`) ?? ''
        : ''
      return { ...record, __tagDisplayText: displayText }
    })
  }

}

