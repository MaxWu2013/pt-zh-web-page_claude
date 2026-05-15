import './TableComponent.scoped.scss';
import { FC, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface TableColumn {
	header: string;
	accessor: string;
}

export interface TableViewSpanConfig {
	rowSpan: { [key: string]: number };
	colSpan: { [key: string]: number };
}

export interface TableViewStylingConfig {
	[key: string]: string;
}

export interface TableViewMappingConfig {
	[key: string]: (value: any) => any;
}

interface TableComponentProps {
	tableColumns: TableColumn[];
	tableData: { [key: string]: any | TableViewSpanConfig }[];
	tableViewStyling: TableViewStylingConfig; // styling mapping
	tableViewMappingConfig: TableViewMappingConfig; // function mapping
}

const TableComponent: FC<TableComponentProps> = ({
	tableColumns,
	tableData,
	tableViewStyling,
	tableViewMappingConfig,
}) => {
	const columnRowIndexMap: { [key: string]: number } = {};

	for (let tableColumn of tableColumns) {
		columnRowIndexMap[tableColumn.accessor] = 0;
	}

	return (
		<table className="table-fixed w-full text-[12px] font-bold text-center border-collapse border-spacing-0 text-white">
			<thead>
				<tr className="sticky top-0 text-header">
					{tableColumns.map((column) => (
						<th
							key={uuidv4()}
							className="bg-table-top px-[7px] py-[7px] text-[14px] leading-[14px] font-normal"
						>
							{column.header}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{tableData.map((row, rowIndex) => {
					return (
						<tr key={uuidv4()}>
							{tableColumns.map((column, colIndex) => {
								const rowSpan = row.rowSpan?.[column.accessor] ?? 1;
								const colSpan = row.colSpan?.[column.accessor] ?? 1;

								if (row[column.accessor] === undefined) {
									return null;
								}

								const styleClassname: string = tableViewStyling?.[column.accessor] ?? '';
								const mapFunc: (value: any) => string =
									tableViewMappingConfig?.[column.accessor] ?? String;

								columnRowIndexMap[column.accessor] = columnRowIndexMap[column.accessor] + 1;
								return (
									<td
										key={colIndex}
										className={`table-border px-[2px] py-[7px] text-[14px] leading-[18px] font-normal ${styleClassname}`}
										rowSpan={rowSpan}
										colSpan={colSpan}
									>
										{mapFunc(row[column.accessor])}
									</td>
								);
							})}
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export const ScrollableTableComponent: FC<TableComponentProps> = ({ ...props }) => {
	const tableRef = useRef<HTMLDivElement>(null);
	const [isScrolled, setIsScrolled] = useState(false);

	const handleScroll = () => {
		if (tableRef.current) {
			const { scrollTop, scrollLeft } = tableRef.current;
			setIsScrolled(scrollTop > 0 || scrollLeft > 0);
		}
	};
	return (
		<div
			ref={tableRef}
			onScroll={handleScroll}
			className={`max-h-[280px] overflow-y-scroll w-[98%] mx-auto ${
				isScrolled ? 'is-scrolled' : ''
			}`}
		>
			<TableComponent {...props} />
		</div>
	);
};

export default TableComponent;
