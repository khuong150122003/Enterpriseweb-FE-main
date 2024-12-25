import { useState, useEffect, useCallback, } from "react";
import { useParams } from "react-router-dom";
import useContributionService from "../../../../services/contributionsServices";
import { createPublicContribution } from "../../../../services/publicContributionService"
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, List, ListItem,
    ListItemIcon, ListItemText, Container, Button, Snackbar, Alert,
    CircularProgress, useTheme
} from '@mui/material';
import wordIcon from '../../../../assets/word.ico';
import imageIcon from '../../../../assets/image.ico';
import defaultIcon from '../../../../assets/default.ico';
import pdfIcon from '../../../../assets/pdf.ico';
import GradingContribution from "./GradingContribution";

const TopicDetail = () => {
    const { topicId, topicName, endDate } = useParams();
    const [contributions, setContributions] = useState([]);
    const contributionsService = useContributionService();
    const [publicContributions, setPublicContributions] = useState(new Set());


    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedContribution, setSelectedContribution] = useState(null);
    const [snackbarState, setSnackbarState] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [hasFetchedData, setHasFetchedData] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await contributionsService.getContributionByTopicId(topicId);
            setContributions(data);
        } catch (error) {
            console.error("Error fetching contributions: ", error);
            setSnackbarState({ open: true, message: 'Error fetching contributions.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [contributionsService, topicId]);

    useEffect(() => {
        if (!hasFetchedData) {
            fetchData();
            setHasFetchedData(true);
        }
    }, [fetchData, hasFetchedData]);

    const handleOpen = (contribution) => {
        setSelectedContribution(contribution);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedContribution(null);
    };

    const handleUpdate = async ({ id, data }) => {
        try {
            await contributionsService.updateContribution(id, data);
            fetchData();
            handleClose();
            setSnackbarState({ open: true, message: 'Contribution updated successfully.', severity: 'success' });
        } catch (error) {
            console.error("Error updating contribution: ", error);
            setSnackbarState({ open: true, message: 'Error updating contribution.', severity: 'error' });
        }
    };

    const handlePublic = async (contributionID) => {
        try {
            const data = { contributionID };

            await createPublicContribution(data);
            setPublicContributions((prev) => new Set(prev.add(contributionID)));
            setSnackbarState({ open: true, message: 'Contribution published successfully.', severity: 'success' });
        } catch (error) {
            console.error("Error publishing contribution:", error);
            setSnackbarState({ open: true, message: error.message || 'Error publishing contribution.', severity: 'error' });
        }
    };

    const handleSnackbarClose = () => {
        setSnackbarState({ ...snackbarState, open: false });
    };

    const getFileIcon = (fileType) => {
        const iconMap = {
            'application/pdf': pdfIcon,
            'image/jpeg': imageIcon,
            'image/png': imageIcon,
            'application/msword': wordIcon,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': wordIcon
        };
        return <img src={iconMap[fileType] || defaultIcon} alt={`${fileType} icon`} style={iconStyles} />;
    };
    const theme = useTheme();

    const getStatusColor = (status) => {
        const statusColorMap = {
            'Pending': theme.palette.primary.main,
            'Approved': theme.palette.success.main,
            'Rejected': theme.palette.error.main,
        };
        return statusColorMap[status] || theme.palette.text.secondary;
    };

    const truncateFileName = (name) => {
        return name.length > MAX_FILE_NAME_LENGTH ? `${name.substring(0, MAX_FILE_NAME_LENGTH)}...` : name;
    };

    const renderContributionRows = () => {
        return contributions.map((contribution) => (
            <TableRow key={contribution._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: styles.lightGray } }}>
                <TableCell>
                    <Typography variant="body1" fontWeight="bold" color={styles.primaryBlue}>
                        {contribution.title}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {contribution.content}
                    </Typography>
                </TableCell>
                <TableCell>{new Date(contribution.submissionDate).toLocaleString()}</TableCell>
                <TableCell>{renderFiles(contribution.files)}</TableCell>
                <TableCell>{contribution.comments}</TableCell>
                <TableCell >
                    <Typography variant="body2" fontWeight="bold" color={getStatusColor(contribution.statusID?.statusName)}>
                        {contribution.statusID?.statusName}
                    </Typography>
                </TableCell>
                <TableCell>
                    {new Date(endDate) > new Date() && (
                        <Button onClick={() => handleOpen(contribution)} variant="contained" color="primary">
                            Grade
                        </Button>
                    )}
                    <Button
                        onClick={() => handlePublic(contribution._id)}
                        variant="contained"
                        color="secondary"
                        disabled={publicContributions.has(contribution._id)}
                    >
                        Public
                    </Button>
                </TableCell>
            </TableRow>
        ));
    };

    const renderFiles = (files) => (
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {files && files.length > 0 ? (
                <List>
                    {files.map((file) => (
                        <ListItem key={file._id}>
                            <ListItemIcon>{getFileIcon(file.fileType)}</ListItemIcon>
                            <ListItemText >
                                <a href={file.filePath} target="_blank" rel="noopener noreferrer">
                                    <strong>{truncateFileName(file.fileName)}</strong>
                                </a>
                            </ListItemText>
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography variant="body1">No files attached</Typography>
            )}
        </div>
    );

    const iconStyles = { width: 50, height: 50 };
    const MAX_FILE_NAME_LENGTH = 30;
    const styles = {
        primaryOrange: "#DD730C",
        primaryGreen: "#4CAF50",
        primaryBlue: "#2196F3",
        lightGray: "#B0BEC5",
        offWhite: "#F5F5F5",
    };

    return (
        <Container sx={{ padding: '20px', backgroundColor: styles.offWhite, borderRadius: '8px', boxShadow: theme.shadows[3] }}>
            <Typography variant="h4" gutterBottom align="center" sx={{ color: styles.primaryBlue }}>
                Topic: <strong>{topicName} </strong>
            </Typography>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <CircularProgress />
                </div>
            ) : contributions.length > 0 ? (
                <TableContainer component={Paper} elevation={3}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: styles.primaryOrange }}>
                                <TableCell sx={{ width: '20%', color: styles.offWhite }}><strong >Title</strong></TableCell>
                                <TableCell sx={{ width: '30%', color: styles.offWhite }}><strong >Content</strong></TableCell>
                                <TableCell sx={{ width: '15%', color: styles.offWhite }}><strong >Submission Date</strong></TableCell>
                                <TableCell sx={{ width: '20%', color: styles.offWhite }}><strong >Files</strong></TableCell>
                                <TableCell sx={{ width: '10%', color: styles.offWhite }}><strong >Feedback</strong></TableCell>
                                <TableCell sx={{ width: '5%', color: styles.offWhite }}><strong >Status</strong></TableCell>
                                <TableCell sx={{ width: '5%', color: styles.offWhite }}><strong>Action</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {renderContributionRows()}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography variant="h6" gutterBottom>
                    No contributions found for this topic.
                </Typography>
            )}
            {selectedContribution && (
                <GradingContribution
                    open={open}
                    onClose={handleClose}
                    contribution={selectedContribution}
                    onUpdate={handleUpdate}
                />
            )}
            <Snackbar open={snackbarState.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarState.severity}>
                    {snackbarState.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TopicDetail;